package com.imagesearch.backend_java.ecommerce.controller;

import com.imagesearch.backend_java.ecommerce.dto.CheckoutRequest;
import com.imagesearch.backend_java.ecommerce.dto.OrderDTO;
import com.imagesearch.backend_java.ecommerce.service.OrderService;
import com.imagesearch.backend_java.index.dto.PageResponse;
import com.imagesearch.backend_java.search.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
@Slf4j(topic = "ORDER-CONTROLLER")
@Tag(name = "E-Commerce Orders", description = "Endpoints for placing orders and tracking customer purchase history")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Checkout and create order", description = "Executes ACID transaction, verifies inventory with pessimistic lock and creates order")
    public BaseResponse<OrderDTO> checkout(
            Authentication authentication,
            @RequestBody @Valid CheckoutRequest request
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return BaseResponse.success(orderService.checkout(username, request));
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current user orders", description = "Returns paginated orders for logged in user")
    public BaseResponse<PageResponse<OrderDTO>> getMyOrders(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return BaseResponse.success(orderService.getUserOrders(username, page, size));
    }

    @GetMapping("/{orderNumber}")
    @Operation(summary = "Get order by order number", description = "Returns detailed order tracking information")
    public BaseResponse<OrderDTO> getOrderByNumber(
            Authentication authentication,
            @PathVariable String orderNumber
    ) {
        String username = authentication != null ? authentication.getName() : null;
        return BaseResponse.success(orderService.getOrderByNumber(username, orderNumber));
    }
}
