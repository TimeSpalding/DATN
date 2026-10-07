package com.imagesearch.backend_java.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {

    @NotBlank(message = "Recipient name is required")
    private String recipientName;

    @NotBlank(message = "Phone number is required")
    private String phoneNumber;

    @NotBlank(message = "Shipping address is required")
    private String shippingAddress;

    @Builder.Default
    private String shippingMethod = "standard";

    @Builder.Default
    private String paymentMethod = "COD";

    private String notes;

    private String couponCode;

    // Optional list of items if checking out without relying solely on saved server cart
    private List<CheckoutItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CheckoutItemRequest {
        private Long variantId;
        private Integer quantity;
    }
}
