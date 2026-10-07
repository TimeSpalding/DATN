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
public class CartItemDTO {
    private Long id;
    private Long productId;
    private String productName;
    private String sku;
    private Long variantId;
    private String size;
    private String color;
    private String colorHex;
    private BigDecimal price;
    private String image;
    private Integer quantity;
    private BigDecimal subtotal;
    private Boolean inStock;
}
