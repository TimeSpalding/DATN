package com.imagesearch.backend_java.search.service;

import com.imagesearch.backend_java.search.config.QdrantProperties;
import com.imagesearch.backend_java.search.config.SearchConfig;
import com.imagesearch.backend_java.search.dto.request.ComposedEmbeddingRequest;
import com.imagesearch.backend_java.search.dto.request.EmbeddingRequest;
import com.imagesearch.backend_java.search.dto.response.EmbeddingResponse;
import com.imagesearch.backend_java.search.network.OkHttpHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Random;

@Slf4j(topic = "AI-EMBEDDING-CLIENT")
@Service
@RequiredArgsConstructor
public class AiEmbeddingClient {
    private final OkHttpHelper okHttpHelper;
    private final QdrantProperties qdrantProperties;
    private final SearchConfig searchConfig;

    @Value("${integration.backend-ai.base-url:http://localhost:8000}")
    private String backendAiBaseUrl;

    // @Value("${integration.backend-ai.mock-embedding:true}")
    
    @Value("${integration.backend-ai.mock-embedding:false}")
    private boolean mockEmbedding;

    public List<Float> getImageEmbedding(EmbeddingRequest request) throws IOException {
        return getFullEmbeddingResponse(buildUrl(searchConfig.getImageEmbeddingPath()), request, "image:" + request.getStoragePath())
                .getEmbedding();
    }

    /**
     * Trả về toàn bộ EmbeddingResponse (embedding + filters dự đoán zero-shot)
     * cho ảnh truy vấn — dùng cho Image Search để áp Hard Filter vào Qdrant.
     */
    public EmbeddingResponse getImageEmbeddingResponse(EmbeddingRequest request) throws IOException {
        return getFullEmbeddingResponse(buildUrl(searchConfig.getImageEmbeddingPath()), request, "image:" + request.getStoragePath());
    }

    public EmbeddingResponse getTextEmbedding(String text) throws IOException {
        EmbeddingRequest request = EmbeddingRequest.builder()
                .type("text")
                .text(text)
                .build();
        return getFullEmbeddingResponse(buildUrl(searchConfig.getTextEmbeddingPath()), request, "text:" + text);
    }

    /**
     * Gọi backend-ai /api/v1/embeddings/composed để sinh composed embedding
     * từ ảnh gốc (kiểu dáng) + text mô tả điều chỉnh (màu, họa tiết...).
     */
    public EmbeddingResponse getComposedEmbedding(ComposedEmbeddingRequest composedRequest) throws IOException {
        if (mockEmbedding) {
            String seed = "composed:" + composedRequest.getModificationText();
            return EmbeddingResponse.builder()
                    .embedding(createMockEmbedding(seed))
                    .build();
        }
        EmbeddingResponse response = okHttpHelper.httpPost(
                buildUrl(searchConfig.getComposedEmbeddingPath()),
                null, composedRequest, EmbeddingResponse.class, null, null
        );
        if (response == null || response.getEmbedding() == null || response.getEmbedding().isEmpty()) {
            throw new IOException("Composed embedding response is empty");
        }
        return response;
    }


    /**
     * Gọi Python /api/v1/search/composed — Python tự gọi Qdrant, đọc metadata_ai,
     * re-rank và trả về danh sách {imageId, score} đã xếp hạng.
     * Java chỉ cần fetch thông tin đầy đủ từ DB theo imageId.
     */
    public ComposedSearchResult getComposedSearchResults(
            ComposedEmbeddingRequest composedRequest,
            int fetchLimit,
            Long excludedImageId
    ) throws IOException {
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        if (composedRequest.getImageEmbedding() != null) body.put("imageEmbedding", composedRequest.getImageEmbedding());
        if (composedRequest.getStoragePath() != null) body.put("storagePath", composedRequest.getStoragePath());
        body.put("modificationText", composedRequest.getModificationText());
        body.put("imageWeight", composedRequest.getImageWeight());
        body.put("limit", fetchLimit);
        if (excludedImageId != null) body.put("excludedImageId", excludedImageId);

        ComposedSearchResult result = okHttpHelper.httpPost(
                buildUrl(searchConfig.getComposedSearchPath()),
                null, body, ComposedSearchResult.class, null, null
        );
        if (result == null) {
            throw new IOException("ComposedSearch response is null");
        }
        return result;
    }

    // DTO nội bộ cho response của /api/v1/search/composed
    @lombok.Data
    public static class ComposedSearchResult {
        private java.util.List<RankedItem> results;
        private java.util.Map<String, java.util.List<String>> targetAttributes;
        private java.util.List<String> textKeys;
    }

    @lombok.Data
    public static class RankedItem {
        private Long imageId;
        private Float score;
    }


    /** Tìm kiếm bằng ảnh upload mới — Python gọi Qdrant + rerank, Java chỉ fetch DB. */
    public ImageSearchResult searchByImage(String storagePath, List<Float> imageEmbedding, int fetchLimit) throws IOException {
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        if (imageEmbedding != null) body.put("imageEmbedding", imageEmbedding);
        if (storagePath != null)    body.put("storagePath", storagePath);
        body.put("limit", fetchLimit);
        ImageSearchResult result = okHttpHelper.httpPost(
                buildUrl(searchConfig.getImageSearchPath()), null, body, ImageSearchResult.class, null, null);
        if (result == null) throw new IOException("searchByImage response is null");
        return result;
    }

    /** Tìm ảnh tương tự theo imageId đã index — Python lấy vector từ Qdrant + rerank. */
    public ImageSearchResult searchByImageId(Long imageId, int fetchLimit) throws IOException {
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("imageId", imageId);
        body.put("limit", fetchLimit);
        ImageSearchResult result = okHttpHelper.httpPost(
                buildUrl(searchConfig.getImageByIdSearchPath()), null, body, ImageSearchResult.class, null, null);
        if (result == null) throw new IOException("searchByImageId response is null");
        return result;
    }

    /** Text semantic search — Python tính embedding, gọi Qdrant, fallback 2 lớp. */
    public TextSearchResult searchByText(String query, int limit) throws IOException {
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("query", query);
        body.put("limit", limit);
        TextSearchResult result = okHttpHelper.httpPost(
                buildUrl(searchConfig.getTextSearchPath()), null, body, TextSearchResult.class, null, null);
        if (result == null) throw new IOException("searchByText response is null");
        return result;
    }

    @lombok.Data
    public static class ImageSearchResult {
        private java.util.List<RankedItem> results;
        private java.util.Map<String, java.util.List<String>> queryAttributes;
    }

    @lombok.Data
    public static class TextSearchResult {
        private java.util.List<RankedItem> results;
    }

    private List<Float> getEmbedding(String url, EmbeddingRequest request, String mockSeed) throws IOException {
        return getFullEmbeddingResponse(url, request, mockSeed).getEmbedding();
    }

    private EmbeddingResponse getFullEmbeddingResponse(String url, EmbeddingRequest request, String mockSeed) throws IOException {
        if (mockEmbedding) {
            return EmbeddingResponse.builder()
                    .embedding(createMockEmbedding(mockSeed))
                    .build();
        }

        EmbeddingResponse response = okHttpHelper.httpPost(url, null, request, EmbeddingResponse.class, null, null);
        if (response == null || response.getEmbedding() == null || response.getEmbedding().isEmpty()) {
            throw new IOException("AI embedding response is empty");
        }
        return response;
    }

    private String buildUrl(String path) {
        return backendAiBaseUrl.replaceAll("/+$", "") + path;
    }

    private List<Float> createMockEmbedding(String seed) {
        Random random = new Random(Objects.hashCode(seed));
        List<Float> embedding = new ArrayList<>(qdrantProperties.getVectorSize());
        for (int i = 0; i < qdrantProperties.getVectorSize(); i++) {
            embedding.add((random.nextFloat() * 2) - 1);
        }
        return embedding;
    }
}
