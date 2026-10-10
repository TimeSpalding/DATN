package com.imagesearch.backend_java.ecommerce.dto;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartRequest {
    private Long variantId;
    private Long productId;
    private String size;
    private String color;
    @Builder.Default
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity = 1;
}
