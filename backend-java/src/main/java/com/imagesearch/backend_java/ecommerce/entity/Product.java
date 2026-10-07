package com.imagesearch.backend_java.ecommerce.entity;

import com.imagesearch.backend_java.ecommerce.enums.ProductStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "products",
        indexes = {
                @Index(name = "idx_products_category", columnList = "category_id"),
                @Index(name = "idx_products_sku", columnList = "sku"),
                @Index(name = "idx_products_status", columnList = "status"),
                @Index(name = "idx_products_gender", columnList = "gender")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, unique = true, length = 100)
    private String sku;

    @Column(nullable = false, length = 500)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "base_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal basePrice;

    @Column(name = "original_price", precision = 14, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "discount_percent")
    private Integer discountPercent;

    @Builder.Default
    @Column(length = 30)
    private String gender = "unisex";

    @Column(name = "sub_category", length = 100)
    private String subCategory;

    @Column(length = 255)
    private String material;

    @Column(length = 255)
    private String origin;

    @Column(length = 50)
    private String badge;

    @Builder.Default
    @Column
    private Double rating = 5.0;

    @Builder.Default
    @Column(name = "reviews_count")
    private Integer reviewsCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private Boolean featured = false;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProductStatus status = ProductStatus.ACTIVE;

    @Builder.Default
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ProductVariant> variants = new ArrayList<>();

    @Builder.Default
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<ProductImage> productImages = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (discountPercent == null && originalPrice != null && basePrice != null && originalPrice.compareTo(basePrice) > 0) {
            BigDecimal diff = originalPrice.subtract(basePrice);
            discountPercent = diff.multiply(BigDecimal.valueOf(100)).divide(originalPrice, 0, java.math.RoundingMode.HALF_UP).intValue();
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (originalPrice != null && basePrice != null && originalPrice.compareTo(basePrice) > 0) {
            BigDecimal diff = originalPrice.subtract(basePrice);
            discountPercent = diff.multiply(BigDecimal.valueOf(100)).divide(originalPrice, 0, java.math.RoundingMode.HALF_UP).intValue();
        }
    }
}
