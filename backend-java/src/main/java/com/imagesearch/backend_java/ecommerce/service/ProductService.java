package com.imagesearch.backend_java.ecommerce.service;

import com.imagesearch.backend_java.ecommerce.dto.ProductDetailDTO;
import com.imagesearch.backend_java.ecommerce.dto.ProductFilterRequest;
import com.imagesearch.backend_java.ecommerce.dto.ProductSummaryDTO;
import com.imagesearch.backend_java.ecommerce.dto.VariantDTO;
import com.imagesearch.backend_java.ecommerce.entity.Category;
import com.imagesearch.backend_java.ecommerce.entity.Product;
import com.imagesearch.backend_java.ecommerce.entity.ProductImage;
import com.imagesearch.backend_java.ecommerce.entity.ProductVariant;
import com.imagesearch.backend_java.ecommerce.enums.ProductStatus;
import com.imagesearch.backend_java.ecommerce.repository.CategoryRepository;
import com.imagesearch.backend_java.ecommerce.repository.ProductRepository;
import com.imagesearch.backend_java.index.dto.PageResponse;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProductSummaryDTO> getProducts(ProductFilterRequest request) {
        int pageIndex = Math.max(0, request.getPage() > 0 ? request.getPage() - 1 : 0);
        int pageSize = Math.max(1, request.getLimit() > 0 ? request.getLimit() : 12);

        Sort sort = resolveSort(request.getSort());
        Pageable pageable = PageRequest.of(pageIndex, pageSize, sort);

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));

            // Category filter
            if (request.getCategory() != null && !request.getCategory().isBlank() && !request.getCategory().equalsIgnoreCase("all")) {
                predicates.add(cb.or(
                        cb.equal(root.get("category").get("code"), request.getCategory()),
                        cb.equal(root.get("subCategory"), request.getCategory())
                ));
            }

            // SubCategory filter
            if (request.getSubCategory() != null && !request.getSubCategory().isBlank()) {
                predicates.add(cb.equal(root.get("subCategory"), request.getSubCategory()));
            }

            // Gender filter
            if (request.getGender() != null && !request.getGender().isBlank() && !request.getGender().equalsIgnoreCase("all")) {
                predicates.add(cb.or(
                        cb.equal(root.get("gender"), request.getGender().toLowerCase()),
                        cb.equal(root.get("gender"), "unisex")
                ));
            }

            // Price range filter
            if (request.getMinPrice() != null && request.getMinPrice().compareTo(BigDecimal.ZERO) > 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("basePrice"), request.getMinPrice()));
            }
            if (request.getMaxPrice() != null && request.getMaxPrice().compareTo(BigDecimal.ZERO) > 0) {
                predicates.add(cb.lessThanOrEqualTo(root.get("basePrice"), request.getMaxPrice()));
            }

            // Keyword search
            if (request.getSearch() != null && !request.getSearch().trim().isEmpty()) {
                String pattern = "%" + request.getSearch().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), pattern),
                        cb.like(cb.lower(root.get("sku")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern),
                        cb.like(cb.lower(root.get("material")), pattern)
                ));
            }

            // Size filter
            if (request.getSize() != null && !request.getSize().isBlank() && !request.getSize().equalsIgnoreCase("all")) {
                Join<Product, ProductVariant> variantJoin = root.join("variants", JoinType.INNER);
                predicates.add(cb.equal(variantJoin.get("size"), request.getSize().toUpperCase()));
                predicates.add(cb.greaterThan(variantJoin.get("stockQuantity"), 0));
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> pageResult = productRepository.findAll(spec, pageable);
        List<ProductSummaryDTO> dtoList = pageResult.getContent().stream()
                .map(this::mapToSummaryDTO)
                .collect(Collectors.toList());

        return PageResponse.of(dtoList, pageIndex, pageSize, pageResult.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ProductDetailDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        return mapToDetailDTO(product);
    }

    @Transactional(readOnly = true)
    public ProductDetailDTO getProductBySku(String sku) {
        Product product = productRepository.findBySku(sku)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with SKU: " + sku));
        return mapToDetailDTO(product);
    }

    @Transactional(readOnly = true)
    public List<ProductSummaryDTO> getRelatedProducts(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + productId));

        Pageable limit = PageRequest.of(0, 8);
        return productRepository.findRelatedProducts(product.getCategory(), product.getId(), limit)
                .stream()
                .map(this::mapToSummaryDTO)
                .collect(Collectors.toList());
    }

    private Sort resolveSort(String sortParam) {
        if (sortParam == null) {
            return Sort.by(Sort.Direction.DESC, "rating");
        }
        return switch (sortParam.toLowerCase()) {
            case "price-asc" -> Sort.by(Sort.Direction.ASC, "basePrice");
            case "price-desc" -> Sort.by(Sort.Direction.DESC, "basePrice");
            case "rating" -> Sort.by(Sort.Direction.DESC, "rating");
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "reviewsCount", "rating");
        };
    }

    public ProductSummaryDTO mapToSummaryDTO(Product product) {
        String primaryImage = resolvePrimaryImage(product);
        List<String> gallery = resolveGallery(product);
        List<ProductSummaryDTO.ColorOptionDTO> colors = resolveColors(product);
        List<ProductSummaryDTO.SizeOptionDTO> sizes = resolveSizes(product);
        boolean inStock = product.getVariants().stream().anyMatch(v -> v.getStockQuantity() > 0);

        return ProductSummaryDTO.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .category(product.getCategory() != null ? product.getCategory().getCode() : "general")
                .subCategory(product.getSubCategory())
                .gender(product.getGender())
                .price(formatPriceVnd(product.getBasePrice()))
                .rawPrice(product.getBasePrice())
                .originalPrice(product.getOriginalPrice())
                .discountPercent(product.getDiscountPercent())
                .badge(product.getBadge())
                .material(product.getMaterial())
                .origin(product.getOrigin())
                .image(primaryImage)
                .gallery(gallery)
                .colors(colors)
                .sizes(sizes)
                .rating(product.getRating())
                .reviewsCount(product.getReviewsCount())
                .featured(product.getFeatured())
                .inStock(inStock)
                .build();
    }

    public ProductDetailDTO mapToDetailDTO(Product product) {
        String primaryImage = resolvePrimaryImage(product);
        List<String> gallery = resolveGallery(product);
        List<ProductSummaryDTO.ColorOptionDTO> colors = resolveColors(product);
        List<ProductSummaryDTO.SizeOptionDTO> sizes = resolveSizes(product);
        boolean inStock = product.getVariants().stream().anyMatch(v -> v.getStockQuantity() > 0);

        List<VariantDTO> variantDTOs = product.getVariants().stream()
                .map(v -> VariantDTO.builder()
                        .id(v.getId())
                        .sku(v.getSku())
                        .size(v.getSize())
                        .color(v.getColor())
                        .colorHex(v.getColorHex())
                        .stockQuantity(v.getStockQuantity())
                        .priceOverride(v.getPriceOverride())
                        .active(v.getActive())
                        .build())
                .collect(Collectors.toList());

        List<ProductSummaryDTO> related = Collections.emptyList();
        try {
            Pageable limit = PageRequest.of(0, 4);
            related = productRepository.findRelatedProducts(product.getCategory(), product.getId(), limit)
                    .stream()
                    .map(this::mapToSummaryDTO)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Failed to load related products for id: {}", product.getId(), e);
        }

        return ProductDetailDTO.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .description(product.getDescription())
                .category(product.getCategory() != null ? product.getCategory().getCode() : "general")
                .subCategory(product.getSubCategory())
                .gender(product.getGender())
                .price(formatPriceVnd(product.getBasePrice()))
                .rawPrice(product.getBasePrice())
                .originalPrice(product.getOriginalPrice())
                .discountPercent(product.getDiscountPercent())
                .badge(product.getBadge())
                .material(product.getMaterial())
                .origin(product.getOrigin())
                .image(primaryImage)
                .gallery(gallery)
                .colors(colors)
                .sizes(sizes)
                .variants(variantDTOs)
                .rating(product.getRating())
                .reviewsCount(product.getReviewsCount())
                .featured(product.getFeatured())
                .inStock(inStock)
                .relatedProducts(related)
                .build();
    }

    private String resolvePrimaryImage(Product product) {
        if (product.getProductImages() == null || product.getProductImages().isEmpty()) {
            return "/samples/cloth-1.jpg";
        }
        return product.getProductImages().stream()
                .filter(ProductImage::getIsPrimary)
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(product.getProductImages().get(0).getImageUrl());
    }

    private List<String> resolveGallery(Product product) {
        if (product.getProductImages() == null || product.getProductImages().isEmpty()) {
            return List.of("/samples/cloth-1.jpg");
        }
        return product.getProductImages().stream()
                .map(ProductImage::getImageUrl)
                .collect(Collectors.toList());
    }

    private List<ProductSummaryDTO.ColorOptionDTO> resolveColors(Product product) {
        Map<String, String> colorMap = new LinkedHashMap<>();
        for (ProductVariant v : product.getVariants()) {
            if (v.getColor() != null && !v.getColor().isBlank()) {
                colorMap.putIfAbsent(v.getColor(), v.getColorHex() != null ? v.getColorHex() : "#111827");
            }
        }
        return colorMap.entrySet().stream()
                .map(e -> ProductSummaryDTO.ColorOptionDTO.builder().name(e.getKey()).hex(e.getValue()).build())
                .collect(Collectors.toList());
    }

    private List<ProductSummaryDTO.SizeOptionDTO> resolveSizes(Product product) {
        return product.getVariants().stream()
                .map(v -> ProductSummaryDTO.SizeOptionDTO.builder()
                        .variantId(v.getId())
                        .size(v.getSize())
                        .stock(v.getStockQuantity())
                        .build())
                .collect(Collectors.toList());
    }

    public static String formatPriceVnd(BigDecimal price) {
        if (price == null) return "0₫";
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.GERMAN);
        symbols.setGroupingSeparator('.');
        DecimalFormat df = new DecimalFormat("#,###", symbols);
        return df.format(price.longValue()) + "₫";
    }
}
