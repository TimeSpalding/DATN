package com.imagesearch.backend_java.ecommerce.controller;

import com.imagesearch.backend_java.ecommerce.dto.CategoryDTO;
import com.imagesearch.backend_java.ecommerce.service.CategoryService;
import com.imagesearch.backend_java.search.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
@Slf4j(topic = "CATEGORY-CONTROLLER")
@Tag(name = "E-Commerce Categories", description = "Endpoints for retrieving fashion product categories")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Get all active categories", description = "Returns hierarchical or flat category tree")
    public BaseResponse<List<CategoryDTO>> getCategories() {
        return BaseResponse.success(categoryService.getAllCategories());
    }

    @GetMapping("/{code}")
    @Operation(summary = "Get category by code", description = "Returns specific category details")
    public BaseResponse<CategoryDTO> getCategory(@PathVariable String code) {
        return BaseResponse.success(categoryService.getCategoryByCode(code));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create category", description = "Admin only endpoint to add a new category")
    public BaseResponse<CategoryDTO> createCategory(@RequestBody CategoryDTO dto) {
        return BaseResponse.success(categoryService.createCategory(dto));
    }
}
