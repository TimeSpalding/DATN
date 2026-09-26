package com.imagesearch.backend_java.tryon.service;

import com.imagesearch.backend_java.auth.entity.User;
import com.imagesearch.backend_java.auth.repository.UserRepository;
import com.imagesearch.backend_java.image.service.MinIOService;
import com.imagesearch.backend_java.tryon.dto.response.TryOnHistoryItem;
import com.imagesearch.backend_java.tryon.dto.response.TryOnHistoryListResponse;
import com.imagesearch.backend_java.tryon.dto.response.TryOnResponse;
import com.imagesearch.backend_java.tryon.entity.TryOnHistory;
import com.imagesearch.backend_java.tryon.exception.TryOnException;
import com.imagesearch.backend_java.tryon.repository.TryOnHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "TRYON-SERVICE")
public class TryOnService {

    private final TryOnHistoryRepository tryOnHistoryRepository;
    private final UserRepository userRepository;
    private final MinIOService minIOService;
    private final RestTemplate restTemplate;

    @Value("${backend.ai.base-url:http://localhost:8000}")
    private String backendAiBaseUrl;

    private static final Set<String> VALID_CATEGORIES = Set.of("upper", "lower", "overall");
    private static final int TRYON_MINIO_PRESIGNED_EXPIRY_SECONDS = 3600;

    @Transactional
    public TryOnResponse requestTryOn(
            String username,
            MultipartFile personImage,
            MultipartFile clothImage,
            String category
    ) {
        if (!VALID_CATEGORIES.contains(category)) {
            throw new TryOnException("INVALID_CATEGORY",
                    "category must be one of: upper, lower, overall", HttpStatus.BAD_REQUEST);
        }

        Long userId = resolveUserId(username);
        long startTime = System.currentTimeMillis();

        // 1. Upload ảnh người + ảnh trang phục lên MinIO
        String personPath = uploadToMinio(personImage, "tryon/person/");
        String clothPath  = uploadToMinio(clothImage,  "tryon/cloth/");

        // 2. Gọi Backend AI Python → /api/v1/tryon
        byte[] resultImageBytes = callAiService(personPath, clothPath, category);

        long processingTimeMs = System.currentTimeMillis() - startTime;

        // 3. Upload ảnh kết quả lên MinIO
        String resultPath = uploadResultToMinio(resultImageBytes);

        // 4. Lưu lịch sử vào DB
        TryOnHistory history = TryOnHistory.builder()
                .userId(userId)
                .personImagePath(personPath)
                .clothImagePath(clothPath)
                .resultImagePath(resultPath)
                .category(category)
                .processingTimeMs(processingTimeMs)
                .build();
        tryOnHistoryRepository.save(history);

        log.info("Try-on thành công: userId={}, historyId={}, processingTime={}ms",
                userId, history.getId(), processingTimeMs);

        return TryOnResponse.builder()
                .historyId(history.getId())
                .resultImageUrl(minIOService.getFileUrl(resultPath))
                .category(category)
                .processingTimeMs(processingTimeMs)
                .createdAt(history.getCreatedAt())
                .build();
    }

    public TryOnHistoryListResponse getHistory(String username, int page, int size) {
        Long userId = resolveUserId(username);
        Page<TryOnHistory> pageResult = tryOnHistoryRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));

        return TryOnHistoryListResponse.builder()
                .results(pageResult.getContent().stream().map(this::toHistoryItem).toList())
                .page(pageResult.getNumber())
                .size(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .first(pageResult.isFirst())
                .last(pageResult.isLast())
                .build();
    }

    @Transactional
    public void deleteHistoryItem(String username, Long historyId) {
        Long userId = resolveUserId(username);
        TryOnHistory history = tryOnHistoryRepository.findById(historyId)
                .filter(h -> h.getUserId().equals(userId))
                .orElseThrow(() -> new TryOnException("NOT_FOUND",
                        "Try-on history not found", HttpStatus.NOT_FOUND));
        tryOnHistoryRepository.delete(history);
    }

    // ───────────── Private helpers ─────────────

    private byte[] callAiService(String personMinioPath, String clothMinioPath, String category) {
        String url = backendAiBaseUrl + "/api/v1/tryon";

        // Tải file ảnh từ MinIO để forward sang AI service
        byte[] personBytes = downloadFromMinio(personMinioPath);
        byte[] clothBytes  = downloadFromMinio(clothMinioPath);

        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("person_image", new ByteArrayResource(personBytes) {
            @Override public String getFilename() { return "person.jpg"; }
        }).contentType(MediaType.IMAGE_JPEG);

        builder.part("cloth_image", new ByteArrayResource(clothBytes) {
            @Override public String getFilename() { return "cloth.jpg"; }
        }).contentType(MediaType.IMAGE_JPEG);

        builder.part("category", category);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, HttpEntity<?>>> request = new HttpEntity<>(builder.build(), headers);

        try {
            log.info("[TryOn] Gọi AI service tại {}", url);
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.POST, request, byte[].class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new TryOnException("AI_SERVICE_ERROR",
                        "AI service trả về lỗi: " + response.getStatusCode(), HttpStatus.BAD_GATEWAY);
            }
            return response.getBody();
        } catch (ResourceAccessException e) {
            log.error("[TryOn] Không kết nối được AI service: {}", e.getMessage());
            throw new TryOnException("AI_SERVICE_UNAVAILABLE",
                    "Không thể kết nối đến AI service. Kiểm tra backend-ai đang chạy không.", HttpStatus.SERVICE_UNAVAILABLE);
        }
    }

    private String uploadToMinio(MultipartFile file, String prefix) {
        try {
            String objectName = prefix + UUID.randomUUID() + getExtension(file.getOriginalFilename());
            minIOService.uploadFile(file, objectName);
            return objectName;
        } catch (Exception e) {
            log.error("[TryOn] Không upload được lên MinIO: {}", e.getMessage());
            throw new TryOnException("MINIO_UPLOAD_ERROR", "Không thể upload ảnh lên MinIO", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String uploadResultToMinio(byte[] imageBytes) {
        try {
            String objectName = "tryon/result/" + UUID.randomUUID() + ".png";
            minIOService.uploadFile(
                    new ByteArrayInputStream(imageBytes),
                    objectName,
                    imageBytes.length,
                    "image/png"
            );
            return objectName;
        } catch (Exception e) {
            log.error("[TryOn] Không upload kết quả lên MinIO: {}", e.getMessage());
            throw new TryOnException("MINIO_UPLOAD_ERROR", "Không thể upload kết quả lên MinIO", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private byte[] downloadFromMinio(String objectName) {
        try {
            return minIOService.downloadFile(objectName).readAllBytes();
        } catch (Exception e) {
            log.error("[TryOn] Không download được ảnh từ MinIO: {}", e.getMessage());
            throw new TryOnException("MINIO_DOWNLOAD_ERROR", "Không thể đọc ảnh từ MinIO", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private TryOnHistoryItem toHistoryItem(TryOnHistory h) {
        return TryOnHistoryItem.builder()
                .id(h.getId())
                .category(h.getCategory())
                .personImageUrl(h.getPersonImagePath() != null ? minIOService.getFileUrl(h.getPersonImagePath()) : null)
                .clothImageUrl(h.getClothImagePath() != null ? minIOService.getFileUrl(h.getClothImagePath()) : null)
                .resultImageUrl(h.getResultImagePath() != null ? minIOService.getFileUrl(h.getResultImagePath()) : null)
                .processingTimeMs(h.getProcessingTimeMs())
                .createdAt(h.getCreatedAt())
                .build();
    }

    private Long resolveUserId(String username) {
        if (username == null) {
            throw new TryOnException("UNAUTHORIZED", "Unauthorized", HttpStatus.UNAUTHORIZED);
        }
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new TryOnException("UNAUTHORIZED", "Unauthorized", HttpStatus.UNAUTHORIZED));
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
