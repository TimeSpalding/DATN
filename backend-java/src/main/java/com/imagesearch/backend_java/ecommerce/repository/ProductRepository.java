package com.imagesearch.backend_java.ecommerce.repository;

import com.imagesearch.backend_java.ecommerce.entity.Category;
import com.imagesearch.backend_java.ecommerce.entity.Product;
import com.imagesearch.backend_java.ecommerce.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    Optional<Product> findBySku(String sku);

    boolean existsBySku(String sku);

    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    long countByStatus(ProductStatus status);

    long countByCategory(Category category);

    long countByCategoryAndStatus(Category category, ProductStatus status);

    @Query("SELECT p FROM Product p WHERE p.category = :category AND p.id <> :id AND p.status = 'ACTIVE' ORDER BY p.rating DESC")
    List<Product> findRelatedProducts(@Param("category") Category category, @Param("id") Long id, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.featured = true AND p.status = 'ACTIVE' ORDER BY p.createdAt DESC")
    List<Product> findFeaturedProducts(Pageable pageable);
}
