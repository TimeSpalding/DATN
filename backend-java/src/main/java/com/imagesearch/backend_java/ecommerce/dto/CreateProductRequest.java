package com.imagesearch.backend_java.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String name;

    @NotBlank(message = "Mã danh mục không được để trống")
    private String categoryCode;

    private String subCategory;

    @Builder.Default
    private String gender = "unisex";

    @NotNull(message = "Giá bán không được để trống")
    private BigDecimal basePrice;

    private BigDecimal originalPrice;

    private String material;

    private String origin;

    private String badge;

    private String description;

    private String image;

    private List<String> gallery;

    private List<CreateVariantRequest> variants;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateVariantRequest {
        private String size;
        private String color;
        private String colorHex;
        private Integer stockQuantity;
        private BigDecimal priceOverride;
    }
}
