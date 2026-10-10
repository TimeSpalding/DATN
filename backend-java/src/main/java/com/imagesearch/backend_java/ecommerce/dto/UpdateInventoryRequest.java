package com.imagesearch.backend_java.ecommerce.dto;

import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInventoryRequest {
    @Min(value = 0, message = "Số lượng tồn kho không được âm")
    private Integer stockQuantity;
    private Integer deltaQuantity; // For incremental restock
    private BigDecimal priceOverride;
    private Boolean active;
}
