package com.imagesearch.backend_java.ecommerce.dto;

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
public class ProductDetailDTO {
    private Long id;
    private String sku;
    private String name;
    private String description;
    private String category;
    private String subCategory;
    private String gender;
    private String price;
    private BigDecimal rawPrice;
    private BigDecimal originalPrice;
    private Integer discountPercent;
    private String badge;
    private String material;
    private String origin;
    private String image;
    private List<String> gallery;
    private List<ProductSummaryDTO.ColorOptionDTO> colors;
    private List<ProductSummaryDTO.SizeOptionDTO> sizes;
    private List<VariantDTO> variants;
    private Double rating;
    private Integer reviewsCount;
    private Boolean featured;
    private Boolean inStock;
    private List<ProductSummaryDTO> relatedProducts;
}
