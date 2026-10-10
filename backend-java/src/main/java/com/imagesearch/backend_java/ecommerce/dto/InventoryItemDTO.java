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
public class InventoryItemDTO {
    private Long variantId;
    private Long productId;
    private String productName;
    private String productSku;
    private String variantSku;
    private String size;
    private String color;
    private String colorHex;
    private Integer stockQuantity;
    private BigDecimal effectivePrice;
    private Boolean active;
    private Boolean lowStock;
    private String primaryImage;
}
