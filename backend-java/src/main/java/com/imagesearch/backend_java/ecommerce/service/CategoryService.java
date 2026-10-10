package com.imagesearch.backend_java.ecommerce.service;

import com.imagesearch.backend_java.ecommerce.dto.CategoryDTO;
import com.imagesearch.backend_java.ecommerce.entity.Category;
import com.imagesearch.backend_java.ecommerce.enums.ProductStatus;
import com.imagesearch.backend_java.ecommerce.repository.CategoryRepository;
import com.imagesearch.backend_java.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryDTO> getAllCategories() {
        return categoryRepository.findByActiveTrueOrderBySortOrderAsc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryDTO getCategoryByCode(String code) {
        Category category = categoryRepository.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with code: " + code));
        return mapToDTO(category);
    }

    @Transactional
    public CategoryDTO createCategory(CategoryDTO dto) {
        if (categoryRepository.existsByCode(dto.getCode())) {
            throw new IllegalArgumentException("Category code already exists: " + dto.getCode());
        }

        Category parent = null;
        if (dto.getParentId() != null) {
            parent = categoryRepository.findById(dto.getParentId()).orElse(null);
        }

        Category category = Category.builder()
                .code(dto.getCode())
                .name(dto.getName())
                .parent(parent)
                .active(dto.getActive() != null ? dto.getActive() : true)
                .sortOrder(dto.getSortOrder() != null ? dto.getSortOrder() : 0)
                .build();

        return mapToDTO(categoryRepository.save(category));
    }

    public CategoryDTO mapToDTO(Category entity) {
        long count = productRepository.countByCategoryAndStatus(entity, ProductStatus.ACTIVE);
        return CategoryDTO.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .parentId(entity.getParent() != null ? entity.getParent().getId() : null)
                .active(entity.getActive())
                .sortOrder(entity.getSortOrder())
                .productCount(count)
                .build();
    }
}
