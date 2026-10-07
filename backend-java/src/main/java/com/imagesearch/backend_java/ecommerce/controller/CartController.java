package com.imagesearch.backend_java.ecommerce.controller;

import com.imagesearch.backend_java.ecommerce.dto.AddToCartRequest;
import com.imagesearch.backend_java.ecommerce.dto.CartDTO;
import com.imagesearch.backend_java.ecommerce.dto.UpdateCartItemRequest;
import com.imagesearch.backend_java.ecommerce.service.CartService;
import com.imagesearch.backend_java.search.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
@Slf4j(topic = "CART-CONTROLLER")
@Tag(name = "E-Commerce Shopping Cart", description = "Endpoints for managing user shopping cart")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get user shopping cart", description = "Fetches line items, quantity, and subtotal")
    public BaseResponse<CartDTO> getCart(Authentication authentication) {
        return BaseResponse.success(cartService.getCart(username(authentication)));
    }

    @PostMapping("/items")
    @Operation(summary = "Add item to cart", description = "Adds a variant to cart or increments quantity")
    public BaseResponse<CartDTO> addToCart(
            Authentication authentication,
            @RequestBody @Valid AddToCartRequest request
    ) {
        return BaseResponse.success(cartService.addToCart(username(authentication), request));
    }

    @PutMapping("/items/{itemId}")
    @Operation(summary = "Update cart item quantity", description = "Updates quantity or deletes item if quantity is zero")
    public BaseResponse<CartDTO> updateCartItem(
            Authentication authentication,
            @PathVariable Long itemId,
            @RequestBody @Valid UpdateCartItemRequest request
    ) {
        return BaseResponse.success(cartService.updateCartItem(username(authentication), itemId, request));
    }

    @DeleteMapping("/items/{itemId}")
    @Operation(summary = "Remove item from cart", description = "Removes specific line item from cart")
    public BaseResponse<CartDTO> removeCartItem(
            Authentication authentication,
            @PathVariable Long itemId
    ) {
        return BaseResponse.success(cartService.removeCartItem(username(authentication), itemId));
    }

    @DeleteMapping
    @Operation(summary = "Clear shopping cart", description = "Removes all items from the current user cart")
    public BaseResponse<String> clearCart(Authentication authentication) {
        cartService.clearCart(username(authentication));
        return BaseResponse.success("Cart cleared successfully");
    }

    private String username(Authentication authentication) {
        return authentication == null ? null : authentication.getName();
    }
}
