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
public class UpdateProductRequest {
    private String name;
    private String categoryCode;
    private String subCategory;
    private String gender;
    private BigDecimal basePrice;
    private BigDecimal originalPrice;
    private String material;
    private String origin;
    private String badge;
    private String description;
    private String status;
    private Boolean featured;
}
