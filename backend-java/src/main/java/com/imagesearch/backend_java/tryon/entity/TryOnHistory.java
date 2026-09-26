package com.imagesearch.backend_java.tryon.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "tryon_history",
        indexes = {
                @Index(name = "idx_tryon_history_user_id", columnList = "user_id"),
                @Index(name = "idx_tryon_history_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TryOnHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** Path trong MinIO của ảnh người mẫu */
    @Column(name = "person_image_path", length = 1000)
    private String personImagePath;

    /** Path trong MinIO của ảnh trang phục */
    @Column(name = "cloth_image_path", length = 1000)
    private String clothImagePath;

    /** Path trong MinIO của ảnh kết quả thử đồ */
    @Column(name = "result_image_path", length = 1000)
    private String resultImagePath;

    /** Loại trang phục: upper, lower, overall */
    @Column(name = "category", length = 20)
    private String category;

    /** Thời gian xử lý AI (ms) */
    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
