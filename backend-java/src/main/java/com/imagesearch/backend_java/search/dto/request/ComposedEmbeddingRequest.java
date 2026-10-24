package com.imagesearch.backend_java.search.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request body gửi lên backend-ai endpoint POST /api/v1/embeddings/composed.
 * Có thể truyền storagePath (ảnh chưa indexed) hoặc imageEmbedding (vector sẵn của ảnh đã indexed).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComposedEmbeddingRequest {
    /** Đường dẫn ảnh trong MinIO — dùng khi user upload ảnh mới từ ngoài. */
    private String storagePath;

    /** Vector 512 chiều của ảnh đã indexed — tránh tính lại embedding khi chọn ảnh từ catalog. */
    private List<Float> imageEmbedding;

    /** Text mô tả điều chỉnh (vd: "áo kẻ, màu xanh rêu"). Bắt buộc. */
    private String modificationText;

    /**
     * Trọng số cho vector ảnh trong phép interpolation: 0.0–1.0.
     * Text nhận (1 - imageWeight). Mặc định 0.6 nghiêng về kiểu dáng ảnh gốc.
     */
    @Builder.Default
    private Float imageWeight = 0.6f;
}
