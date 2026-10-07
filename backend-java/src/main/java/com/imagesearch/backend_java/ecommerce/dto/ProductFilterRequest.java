package com.imagesearch.backend_java.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterRequest {
    @Builder.Default
    private String category = "all";
    private String subCategory;
    @Builder.Default
    private String gender = "all";
    private String search;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    @Builder.Default
    private String size = "all";
    @Builder.Default
    private String sort = "popular";
    @Builder.Default
    private int page = 0;
    @Builder.Default
    private int limit = 12;
}
