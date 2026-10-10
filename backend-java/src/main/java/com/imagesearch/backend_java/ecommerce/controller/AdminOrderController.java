package com.imagesearch.backend_java.ecommerce.controller;

import com.imagesearch.backend_java.ecommerce.dto.OrderDTO;
import com.imagesearch.backend_java.ecommerce.dto.UpdateOrderStatusRequest;
import com.imagesearch.backend_java.ecommerce.service.OrderService;
import com.imagesearch.backend_java.index.dto.PageResponse;
import com.imagesearch.backend_java.search.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/orders")
@RequiredArgsConstructor
@Slf4j(topic = "ADMIN-ORDER-CONTROLLER")
@Tag(name = "Admin Order Management", description = "Endpoints for managing store orders and fulfillment")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class AdminOrderController {

    private final OrderService orderService;

    @GetMapping
    @Operation(summary = "Get all customer orders", description = "Returns all store orders sorted by most recent")
    public BaseResponse<PageResponse<OrderDTO>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return BaseResponse.success(orderService.getAllOrders(page, size));
    }

    @PutMapping("/{orderId}/status")
    @Operation(summary = "Update order fulfillment status", description = "Mutates order status, payment status, or tracking code")
    public BaseResponse<OrderDTO> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestBody UpdateOrderStatusRequest request
    ) {
        return BaseResponse.success(orderService.updateOrderStatus(orderId, request));
    }
}
