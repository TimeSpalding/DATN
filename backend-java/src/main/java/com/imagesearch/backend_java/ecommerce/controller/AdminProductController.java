package com.imagesearch.backend_java.ecommerce.controller;

import com.imagesearch.backend_java.ecommerce.dto.*;
import com.imagesearch.backend_java.ecommerce.service.ProductService;
import com.imagesearch.backend_java.index.dto.PageResponse;
import com.imagesearch.backend_java.search.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j(topic = "ADMIN-PRODUCT-CONTROLLER")
@Tag(name = "Admin Product & Inventory Management", description = "Endpoints for managing products, catalog, and inventory stock")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class AdminProductController {

    private final ProductService productService;

    @PostMapping("/products")
    @Operation(summary = "Create product", description = "Creates a new product with variants and images")
    public BaseResponse<ProductDetailDTO> createProduct(@Valid @RequestBody CreateProductRequest request) {
        log.info("POST /admin/products: Create product name='{}', category='{}'", request.getName(), request.getCategoryCode());
        return BaseResponse.success(productService.createProduct(request));
    }

    @PutMapping("/products/{id}")
    @Operation(summary = "Update product", description = "Updates product fields, status, pricing, and category")
    public BaseResponse<ProductDetailDTO> updateProduct(
            @PathVariable Long id,
            @RequestBody UpdateProductRequest request
    ) {
        log.info("PUT /admin/products/{}: Update product fields", id);
        return BaseResponse.success(productService.updateProduct(id, request));
    }

    @DeleteMapping("/products/{id}")
    @Operation(summary = "Deactivate product", description = "Soft deletes/deactivates a product from public catalog")
    public BaseResponse<String> deleteProduct(@PathVariable Long id) {
        log.info("DELETE /admin/products/{}: Deactivate product", id);
        productService.deleteProduct(id);
        return BaseResponse.success("Sản phẩm đã được ngưng kích hoạt");
    }

    @GetMapping("/inventory")
    @Operation(summary = "Get inventory listing", description = "Returns stock levels for all product variants with low-stock filtering")
    public BaseResponse<PageResponse<InventoryItemDTO>> getInventory(
            @RequestParam(defaultValue = "false") boolean lowStockOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("GET /admin/inventory: Fetch inventory, lowStockOnly={}, page={}, size={}", lowStockOnly, page, size);
        return BaseResponse.success(productService.getInventory(lowStockOnly, page, size));
    }

    @PutMapping("/inventory/{variantId}")
    @Operation(summary = "Update variant inventory", description = "Updates stock level, delta restock, price override, and active state")
    public BaseResponse<InventoryItemDTO> updateInventory(
            @PathVariable Long variantId,
            @Valid @RequestBody UpdateInventoryRequest request
    ) {
        log.info("PUT /admin/inventory/{}: Update stock quantity", variantId);
        return BaseResponse.success(productService.updateInventory(variantId, request));
    }
}
