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
public class VariantDTO {
    private Long id;
    private String sku;
    private String size;
    private String color;
    private String colorHex;
    private Integer stockQuantity;
    private BigDecimal priceOverride;
    private Boolean active;
}
