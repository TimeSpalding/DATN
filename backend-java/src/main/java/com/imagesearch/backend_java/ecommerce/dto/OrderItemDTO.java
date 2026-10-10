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
public class OrderItemDTO {
    private Long id;
    private Long variantId;
    private String name;
    private String sku;
    private String size;
    private String color;
    private BigDecimal price;
    private Integer quantity;
    private String image;
    private BigDecimal subtotal;
}
