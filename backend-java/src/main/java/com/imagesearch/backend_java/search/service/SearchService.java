package com.imagesearch.backend_java.search.service;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.imagesearch.backend_java.auth.entity.User;
import com.imagesearch.backend_java.auth.repository.UserRepository;
import com.imagesearch.backend_java.image.entity.ImageEntity;
import com.imagesearch.backend_java.image.repository.ImageRepository;
import com.imagesearch.backend_java.image.service.ImageThumbnailService;
import com.imagesearch.backend_java.image.service.MinIOService;
import com.imagesearch.backend_java.search.common.SearchType;
import com.imagesearch.backend_java.search.config.SearchConfig;
import com.imagesearch.backend_java.search.dto.request.ComposedEmbeddingRequest;
import com.imagesearch.backend_java.search.dto.request.EmbeddingRequest;
import com.imagesearch.backend_java.search.dto.response.EmbeddingResponse;
import com.imagesearch.backend_java.search.dto.response.ImageSearchResponse;
import com.imagesearch.backend_java.search.dto.response.SearchResultItem;
import com.imagesearch.backend_java.search.dto.response.TextSearchResponse;
import com.imagesearch.backend_java.search.entity.ImageOcr;
import com.imagesearch.backend_java.search.entity.SearchHistory;
import com.imagesearch.backend_java.search.exception.ImageUploadException;
import com.imagesearch.backend_java.search.exception.SearchException;
import com.imagesearch.backend_java.search.repository.ImageOcrRepository;
import com.imagesearch.backend_java.search.repository.SearchHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "SEARCH-SERVICE")
public class SearchService {
    private final MinIOService minIOService;
    private final ImageThumbnailService imageThumbnailService;
    private final ImageRepository imageRepository;
    private final ImageOcrRepository imageOcrRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final UserRepository userRepository;
    private final AiEmbeddingClient aiEmbeddingClient;
    private final QdrantVectorService qdrantVectorService;
    private final SearchConfig searchConfig;

    // Ngưỡng "rớt đài": nếu score giảm đột ngột hơn mức này so với điểm liền trước,
    // coi như phần còn lại là hàng dạt (AI phân loại nhầm bị ép lấy cho đủ limit).
    // Đã hạ xuống 0.08f (FashionCLIP có khoảng cách score hẹp).
    private static final float ELBOW_DROP_THRESHOLD = 0.08f;
    // Ngưỡng tuyệt đối: score thấp hơn mức này thì luôn bị loại dù không rớt đột ngột.
    // Đã hạ xuống 0.12f để không lỡ mất kết quả đúng khi có Hard Filter.
    private static final float MIN_ABSOLUTE_SCORE = 0.12f;

    public ImageSearchResponse searchByImage(MultipartFile image, String username, Integer limit, Integer page, Integer pageSize) {
        long startTime = System.currentTimeMillis();
        validateImage(image);
        SearchPageCriteria pageCriteria = resolvePageCriteria(limit, page, pageSize);

        String storagePath = uploadQueryImage(image);
        String imageUrl = minIOService.getPresignedFileUrl(storagePath);

        try {
            ImageThumbnailService.ThumbnailResult thumbnail = imageThumbnailService.createThumbnail(image);

            ImageEntity queryImage = ImageEntity.builder()
                    .uploadedBy(resolveUser(username))
                    .originalFileName(image.getOriginalFilename())
                    .storagePath(storagePath)
                    .thumbnailPath(thumbnail.thumbnailPath())
                    .mimeType(normalizeContentType(image.getContentType()))
                    .fileSize(image.getSize())
                    .width(thumbnail.width())
                    .height(thumbnail.height())
                    .indexStatus(null)
                    .indexedAt(null)
                    .build();
            queryImage = imageRepository.save(queryImage);

            // Python backend-ai: tính embedding, gọi Qdrant, re-rank, trả về imageId đã xếp hạng
            int fetchLimit = Math.max(pageCriteria.limit() * 10, 200);
            AiEmbeddingClient.ImageSearchResult searchResult =
                    aiEmbeddingClient.searchByImage(storagePath, null, fetchLimit);
            log.info("[SearchByImage] Python returned {} results", 
                searchResult.getResults() != null ? searchResult.getResults().size() : 0);
            List<SearchResultItem> results = buildResultsFromRanked(searchResult.getResults());
            SearchHistory history = pageCriteria.page() == 0 ? saveHistory(
                    username,
                    SearchType.IMAGE_TO_IMAGE,
                    null,
                    storagePath,
                    queryImage.getId(),
                    startTime
            ) : null;

            ImageSearchResponse response = new ImageSearchResponse();
            response.setSearchId(history == null ? null : history.getId());
            response.setSearchType(SearchType.IMAGE_TO_IMAGE.name());
            response.setQueryImageUrl(imageUrl);
            response.setProcessingTimeMs(history == null ? System.currentTimeMillis() - startTime : history.getProcessingTimeMs());
            applyPage(response, results, pageCriteria);
            return response;
        } catch (IOException e) {
            throw new SearchException("VECTOR_SEARCH_ERROR", "Could not search vectors", HttpStatus.INTERNAL_SERVER_ERROR, e);
        } catch (SearchException e) {
            throw e;
        } catch (Exception e) {
            log.error(e.getMessage());
            throw new SearchException("SEARCH_ERROR", "Could not search by image", HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }

    public ImageSearchResponse searchSimilarImage(Long imageId, String username, Integer limit, Integer page, Integer pageSize) {
        long startTime = System.currentTimeMillis();
        SearchPageCriteria pageCriteria = resolvePageCriteria(limit, page, pageSize);
        ImageEntity queryImage = imageRepository.findByIdAndDeletedFalse(imageId)
                .orElseThrow(() -> new SearchException("IMAGE_NOT_FOUND", "Image not found", HttpStatus.NOT_FOUND));

        try {
            // Python backend-ai: lấy vector từ Qdrant theo imageId, re-rank, trả về danh sách
            int fetchLimit = Math.max(pageCriteria.limit() * 10, 200);
            AiEmbeddingClient.ImageSearchResult searchResult =
                    aiEmbeddingClient.searchByImageId(imageId, fetchLimit);
            log.info("[SearchSimilar] Python returned {} results",
                searchResult.getResults() != null ? searchResult.getResults().size() : 0);
            List<SearchResultItem> results = buildResultsFromRanked(searchResult.getResults());

            SearchHistory history = pageCriteria.page() == 0 ? saveHistory(
                    username,
                    SearchType.IMAGE_TO_IMAGE,
                    null,
                    queryImage.getStoragePath(),
                    queryImage.getId(),
                    startTime
            ) : null;

            ImageSearchResponse response = new ImageSearchResponse();
            response.setSearchId(history == null ? null : history.getId());
            response.setSearchType(SearchType.IMAGE_TO_IMAGE.name());
            response.setQueryImageUrl("/visual-search/v1/images/" + queryImage.getId());
            response.setProcessingTimeMs(history == null ? System.currentTimeMillis() - startTime : history.getProcessingTimeMs());
            applyPage(response, results, pageCriteria);
            return response;
        } catch (IOException e) {
            throw new SearchException("VECTOR_SEARCH_ERROR", "Could not search vectors", HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }

    /**
     * Tìm kiếm lai (Composed Search): Kết hợp kiểu dáng từ ảnh + thuộc tính điều chỉnh từ text.
     *
     * @param image           File ảnh upload (nullable nếu dùng imageId)
     * @param imageId         ID ảnh đã indexed trong catalog (nullable nếu dùng file upload)
     * @param modificationText Text mô tả điều chỉnh ("áo kẻ, màu xanh rêu")
     * @param imageWeight     Trọng số ảnh [0–1]; text nhận 1 - imageWeight. Mặc định 0.6
     */
    public ImageSearchResponse searchByComposed(
            MultipartFile image,
            Long imageId,
            String modificationText,
            Float imageWeight,
            String username,
            Integer limit,
            Integer page,
            Integer pageSize
    ) {
        long startTime = System.currentTimeMillis();
        if ((image == null || image.isEmpty()) && imageId == null) {
            throw new SearchException("IMAGE_REQUIRED", "Either image file or imageId must be provided", HttpStatus.BAD_REQUEST);
        }
        if (modificationText == null || modificationText.isBlank()) {
            throw new SearchException("TEXT_REQUIRED", "modificationText is required", HttpStatus.BAD_REQUEST);
        }
        SearchPageCriteria pageCriteria = resolvePageCriteria(limit, page, pageSize);

        try {
            ComposedEmbeddingRequest composedReq;
            String queryImageUrl;
            String queryStoragePath;

            if (imageId != null) {
                // Dùng ảnh đã indexed — lấy vector sẵn từ Qdrant để tránh encode lại
                ImageEntity indexedImage = imageRepository.findByIdAndDeletedFalse(imageId)
                        .orElseThrow(() -> new SearchException("IMAGE_NOT_FOUND", "Image not found", HttpStatus.NOT_FOUND));

                // Lấy vector sẵn từ Qdrant theo point ID; nếu không có (chưa indexed) thì fallback sang storagePath
                List<Float> existingEmbedding = qdrantVectorService.getEmbeddingByPointId(imageId);

                if (existingEmbedding != null && !existingEmbedding.isEmpty()) {
                    composedReq = ComposedEmbeddingRequest.builder()
                            .imageEmbedding(existingEmbedding)
                            .modificationText(modificationText.trim())
                            .imageWeight(imageWeight != null ? imageWeight : 0.6f)
                            .build();
                } else {
                    composedReq = ComposedEmbeddingRequest.builder()
                            .storagePath(indexedImage.getStoragePath())
                            .modificationText(modificationText.trim())
                            .imageWeight(imageWeight != null ? imageWeight : 0.6f)
                            .build();
                }

                queryStoragePath = indexedImage.getStoragePath();
                queryImageUrl = "/visual-search/v1/images/" + indexedImage.getId();
            } else {
                // Dùng ảnh upload mới
                validateImage(image);
                queryStoragePath = uploadQueryImage(image);
                queryImageUrl = minIOService.getPresignedFileUrl(queryStoragePath);

                composedReq = ComposedEmbeddingRequest.builder()
                        .storagePath(queryStoragePath)
                        .modificationText(modificationText.trim())
                        .imageWeight(imageWeight != null ? imageWeight : 0.6f)
                        .build();

                // Lưu ảnh query vào DB (không cần index vào Qdrant — đây chỉ là ảnh tham chiếu)
                ImageThumbnailService.ThumbnailResult thumbnail = imageThumbnailService.createThumbnail(image);
                ImageEntity queryImage = ImageEntity.builder()
                        .uploadedBy(resolveUser(username))
                        .originalFileName(image.getOriginalFilename())
                        .storagePath(queryStoragePath)
                        .thumbnailPath(thumbnail.thumbnailPath())
                        .mimeType(normalizeContentType(image.getContentType()))
                        .fileSize(image.getSize())
                        .width(thumbnail.width())
                        .height(thumbnail.height())
                        .indexStatus(null)
                        .build();
                imageRepository.save(queryImage);
            }

            // Gọi Python backend-ai — tự gọi Qdrant, đọc metadata_ai, re-rank
            // và trả về danh sách imageId đã xếp hạng. Java chỉ cần fetch DB theo ID.
            int fetchLimit = Math.max(pageCriteria.limit() * 10, 200);
            AiEmbeddingClient.ComposedSearchResult searchResult =
                    aiEmbeddingClient.getComposedSearchResults(composedReq, fetchLimit, imageId);

            log.info("[Composed] Python re-ranked {} candidates", 
                searchResult.getResults() != null ? searchResult.getResults().size() : 0);

            // Chuyển kết quả Python sang SearchResultItem (Java chỉ fetch DB theo imageId)
            List<SearchResultItem> results = buildResultsFromRanked(searchResult.getResults());

            // Lưu lịch sử
            SearchHistory history = pageCriteria.page() == 0 ? saveHistory(
                    username, SearchType.COMPOSED,
                    modificationText.trim(), queryStoragePath, imageId, startTime
            ) : null;

            ImageSearchResponse response = new ImageSearchResponse();
            response.setSearchId(history == null ? null : history.getId());
            response.setSearchType(SearchType.COMPOSED.name());
            response.setQueryImageUrl(queryImageUrl);
            response.setProcessingTimeMs(history == null
                    ? System.currentTimeMillis() - startTime
                    : history.getProcessingTimeMs());
            applyPage(response, results, pageCriteria);
            return response;

        } catch (SearchException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Composed] Error: {}", e.getMessage(), e);
            throw new SearchException("COMPOSED_SEARCH_ERROR", "Could not perform composed search", HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }

    private String uploadQueryImage(MultipartFile image) {
        try {
            log.warn("start upload");
            return minIOService.uploadFile(image);
        } catch (Exception e) {
            log.error("Could not upload query image to MinIO", e);
            throw new ImageUploadException("Could not upload image", e);
        }
    }

    public TextSearchResponse searchByText(String query, String mode, String username, Integer limit, Integer page, Integer pageSize) {
        long startTime = System.currentTimeMillis();
        validateTextSearch(query, mode);
        SearchPageCriteria pageCriteria = resolvePageCriteria(limit, page, pageSize);

        if ("semantic".equalsIgnoreCase(mode)) {
            return searchTextSemantic(query.trim(), username, startTime, pageCriteria);
        }
        return searchTextOcr(query.trim(), username, startTime, pageCriteria);
    }

    private TextSearchResponse searchTextSemantic(String query, String username, long startTime, SearchPageCriteria pageCriteria) {
        try {
            log.info("[TextSemantic] Delegating to Python search pipeline");
            // Python: tính embedding, gọi Qdrant với hard filter, fallback 2 lớp
            AiEmbeddingClient.TextSearchResult searchResult =
                    aiEmbeddingClient.searchByText(query, pageCriteria.limit());
            log.info("[TextSemantic] Python returned {} results",
                searchResult.getResults() != null ? searchResult.getResults().size() : 0);

            // Fetch thông tin đầy đủ từ DB theo imageId trả về
            List<SearchResultItem> results = buildResultsFromRanked(searchResult.getResults());

            SearchHistory history = pageCriteria.page() == 0
                    ? saveHistory(username, SearchType.TEXT_SEMANTIC, query, null, null, startTime)
                    : null;
            return buildTextResponse(query, "semantic", SearchType.TEXT_SEMANTIC, history, results, pageCriteria);
        } catch (IOException e) {
            throw new SearchException("AI_SERVICE_ERROR", "Could not create text embedding", HttpStatus.INTERNAL_SERVER_ERROR, e);
        }
    }

    private TextSearchResponse searchTextOcr(String query, String username, long startTime, SearchPageCriteria pageCriteria) {
        log.info("search OCR with query: {}", query);
        List<ImageOcr> ocrMatches = imageOcrRepository.findByExtractedTextContainingIgnoreCaseOrderByCreatedAtDesc(
                query,
                PageRequest.of(0, pageCriteria.limit())
        );
        List<Long> imageIds = ocrMatches.stream()
                .map(ImageOcr::getImageId)
                .distinct()
                .toList();
        Map<Long, ImageEntity> imagesById = imageRepository.findAllByIdInAndDeletedFalse(imageIds).stream()
                .collect(Collectors.toMap(ImageEntity::getId, Function.identity()));

        List<SearchResultItem> results = new ArrayList<>();
        int rank = 1;
        Set<Long> added = new HashSet<>();
        for (Long imageId : imageIds) {
            ImageEntity image = imagesById.get(imageId);
            if (image != null && added.add(imageId)) {
                results.add(toSearchResultItem(image, null, rank++));
            }
        }

        SearchHistory history = pageCriteria.page() == 0
                ? saveHistory(username, SearchType.TEXT_OCR, query, null, null, startTime)
                : null;
        return buildTextResponse(query, "ocr", SearchType.TEXT_OCR, history, results, pageCriteria);
    }

    private Long readPointId(JsonObject point) {
        if (!point.has("id")) {
            return null;
        }
        JsonElement id = point.get("id");
        if (id.isJsonPrimitive() && id.getAsJsonPrimitive().isNumber()) {
            return id.getAsLong();
        }
        if (id.isJsonPrimitive() && id.getAsJsonPrimitive().isString()) {
            try {
                return Long.parseLong(id.getAsString());
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private SearchResultItem toSearchResultItem(ImageEntity image, Float score, int rank) {
        String imageProxyUrl = "/visual-search/v1/images/" + image.getId();

        return SearchResultItem.builder()
                .imageId(image.getId())
                .originalFilename(image.getOriginalFileName())
            .imageUrl(imageProxyUrl)
            .thumbnailUrl(imageProxyUrl)
                .similarityScore(score)
                .rankPosition(rank)
                .width(image.getWidth())
                .height(image.getHeight())
                .mimeType(image.getMimeType())
                .metadataAi(image.getMetadataAi())
                .build();
    }

    private SearchHistory saveHistory(
            String username,
            SearchType searchType,
            String queryText,
            String queryImagePath,
            Long queryImageId,
            long startTime
    ) {
        SearchHistory history = SearchHistory.builder()
                .userId(resolveUserId(username))
                .searchType(searchType)
                .queryText(queryText)
                .queryImagePath(queryImagePath)
                .queryImageId(queryImageId)
                .processingTimeMs(System.currentTimeMillis() - startTime)
                .build();
        return searchHistoryRepository.save(history);
    }

    private TextSearchResponse buildTextResponse(
            String query,
            String mode,
            SearchType searchType,
            SearchHistory history,
            List<SearchResultItem> results,
            SearchPageCriteria pageCriteria
    ) {
        TextSearchResponse response = new TextSearchResponse();
        response.setSearchId(history == null ? null : history.getId());
        response.setSearchType(searchType.name());
        response.setQueryText(query);
        response.setMode(mode);
        response.setProcessingTimeMs(history == null ? null : history.getProcessingTimeMs());
        applyPage(response, results, pageCriteria);
        return response;
    }

    private SearchPageCriteria resolvePageCriteria(Integer limit, Integer page, Integer pageSize) {
        int resolvedLimit = limit == null ? searchConfig.getDefaultSearchLimit() : limit;
        int requestedPage = page == null ? searchConfig.getDefaultPage() : page;
        int resolvedPageSize = pageSize == null ? searchConfig.getDefaultPageSize() : pageSize;

        if (resolvedLimit <= 0) {
            throw new SearchException("INVALID_LIMIT", "Limit must be greater than 0", HttpStatus.BAD_REQUEST);
        }
        if (requestedPage < 0) {
            throw new SearchException("INVALID_PAGE", "Page must be greater than or equal to 0", HttpStatus.BAD_REQUEST);
        }
        if (resolvedPageSize <= 0) {
            throw new SearchException("INVALID_PAGE_SIZE", "Page size must be greater than 0", HttpStatus.BAD_REQUEST);
        }

        int zeroBasedPage = requestedPage <= 1 ? 0 : requestedPage - 1;
        return new SearchPageCriteria(resolvedLimit, zeroBasedPage, resolvedPageSize);
    }

    private void applyPage(ImageSearchResponse response, List<SearchResultItem> results, SearchPageCriteria pageCriteria) {
        int totalElements = results.size();
        int totalPages = calculateTotalPages(totalElements, pageCriteria.pageSize());
        int fromIndex = Math.min(pageCriteria.page() * pageCriteria.pageSize(), totalElements);
        int toIndex = Math.min(fromIndex + pageCriteria.pageSize(), totalElements);

        response.setResults(results.subList(fromIndex, toIndex));
        response.setPage(pageCriteria.page());
        response.setSize(pageCriteria.pageSize());
        response.setTotalElements(totalElements);
        response.setTotalPages(totalPages);
        response.setFirst(pageCriteria.page() == 0);
        response.setLast(totalPages == 0 || pageCriteria.page() >= totalPages - 1);
    }

    private int calculateTotalPages(int totalElements, int pageSize) {
        return totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / pageSize);
    }

    private void validateImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new SearchException("IMAGE_REQUIRED", "Image is required", HttpStatus.BAD_REQUEST);
        }
        if (image.getSize() > searchConfig.getMaxImageSizeBytes()) {
            throw new SearchException("FILE_TOO_LARGE", "Image size must not exceed 10MB", HttpStatus.PAYLOAD_TOO_LARGE);
        }

        String contentType = normalizeContentType(image.getContentType());
        if (!searchConfig.getSupportedImageTypes().contains(contentType)) {
            throw new SearchException("UNSUPPORTED_IMAGE_TYPE", "Only JPG, PNG and WebP images are supported", HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        }
    }

    private void validateTextSearch(String query, String mode) {
        if (query == null || query.trim().isEmpty()) {
            throw new SearchException("QUERY_REQUIRED", "Query is required", HttpStatus.BAD_REQUEST);
        }
        if (mode == null || (!"semantic".equalsIgnoreCase(mode) && !"ocr".equalsIgnoreCase(mode))) {
            throw new SearchException("INVALID_MODE", "Mode must be semantic or ocr", HttpStatus.BAD_REQUEST);
        }
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null) {
            return "";
        }
        String normalized = contentType.toLowerCase(Locale.ROOT);
        return "image/jpg".equals(normalized) ? "image/jpeg" : normalized;
    }

    private Long resolveUserId(String username) {
        if (username == null) {
            return null;
        }
        return userRepository.findByUsername(username)
                .map(User::getId)
                .orElse(null);
    }

    private User resolveUser(String username) {
        if (username == null) {
            return null;
        }
        return userRepository.findByUsername(username).orElse(null);
    }

    private record QdrantHit(Long imageId, Float score) {
    }

    private record SearchPageCriteria(int limit, int page, int pageSize) {
    }


    /**
     * Chuyển danh sách {imageId, score} từ Python sang SearchResultItem
     * bằng cách batch-fetch thông tin đầy đủ từ PostgreSQL.
     */
    private List<SearchResultItem> buildResultsFromRanked(
            List<AiEmbeddingClient.RankedItem> ranked
    ) {
        if (ranked == null || ranked.isEmpty()) return Collections.emptyList();

        List<Long> imageIds = ranked.stream()
                .map(AiEmbeddingClient.RankedItem::getImageId)
                .filter(java.util.Objects::nonNull)
                .toList();

        Map<Long, Float> scoreById = ranked.stream()
                .filter(r -> r.getImageId() != null && r.getScore() != null)
                .collect(Collectors.toMap(
                        AiEmbeddingClient.RankedItem::getImageId,
                        AiEmbeddingClient.RankedItem::getScore,
                        (a, b) -> a
                ));

        Map<Long, ImageEntity> imagesById = imageRepository.findAllByIdInAndDeletedFalse(imageIds)
                .stream()
                .collect(Collectors.toMap(ImageEntity::getId, Function.identity()));

        List<SearchResultItem> results = new ArrayList<>();
        int rank = 1;
        for (Long imgId : imageIds) {
            ImageEntity img = imagesById.get(imgId);
            if (img != null) {
                results.add(toSearchResultItem(img, scoreById.get(imgId), rank++));
            }
        }
        return results;
    }

    private String extractFirstString(Object val) {
        if (val == null) return null;
        if (val instanceof String s) return s;
        if (val instanceof List<?> l && !l.isEmpty()) {
            Object first = l.get(0);
            return first != null ? first.toString() : null;
        }
        return val.toString();
    }
}
