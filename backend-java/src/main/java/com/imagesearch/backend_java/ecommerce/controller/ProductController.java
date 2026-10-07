package com.imagesearch.backend_java.ecommerce.controller;

import com.imagesearch.backend_java.ecommerce.dto.ProductDetailDTO;
import com.imagesearch.backend_java.ecommerce.dto.ProductFilterRequest;
import com.imagesearch.backend_java.ecommerce.dto.ProductSummaryDTO;
import com.imagesearch.backend_java.ecommerce.service.ProductService;
import com.imagesearch.backend_java.index.dto.PageResponse;
import com.imagesearch.backend_java.search.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Slf4j(topic = "PRODUCT-CONTROLLER")
@Tag(name = "E-Commerce Products", description = "Endpoints for catalog browsing and product details")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Get paginated products catalog", description = "Filter by category, gender, size, price, search keyword and sort order")
    public BaseResponse<PageResponse<ProductSummaryDTO>> getProducts(
            @RequestParam(required = false, defaultValue = "all") String category,
            @RequestParam(required = false) String subCategory,
            @RequestParam(required = false, defaultValue = "all") String gender,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false, defaultValue = "all") String size,
            @RequestParam(required = false, defaultValue = "popular") String sort,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "12") int limit
    ) {
        ProductFilterRequest filter = ProductFilterRequest.builder()
                .category(category)
                .subCategory(subCategory)
                .gender(gender)
                .search(search)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .size(size)
                .sort(sort)
                .page(page)
                .limit(limit)
                .build();

        return BaseResponse.success(productService.getProducts(filter));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product detail by ID", description = "Returns full product info, variants, sizes and related items")
    public BaseResponse<ProductDetailDTO> getProductById(@PathVariable Long id) {
        return BaseResponse.success(productService.getProductById(id));
    }

    @GetMapping("/sku/{sku}")
    @Operation(summary = "Get product detail by SKU", description = "Lookup product by unique SKU")
    public BaseResponse<ProductDetailDTO> getProductBySku(@PathVariable String sku) {
        return BaseResponse.success(productService.getProductBySku(sku));
    }

    @GetMapping("/{id}/related")
    @Operation(summary = "Get related products", description = "Returns related products in same category")
    public BaseResponse<List<ProductSummaryDTO>> getRelatedProducts(@PathVariable Long id) {
        return BaseResponse.success(productService.getRelatedProducts(id));
    }
}
