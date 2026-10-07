package com.imagesearch.backend_java.ecommerce.repository;

import com.imagesearch.backend_java.ecommerce.entity.ProductVariant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

    Optional<ProductVariant> findBySku(String sku);

    List<ProductVariant> findByProductId(Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT pv FROM ProductVariant pv WHERE pv.id = :id")
    Optional<ProductVariant> findByIdWithLock(@Param("id") Long id);

    @Query("SELECT pv FROM ProductVariant pv JOIN FETCH pv.product p WHERE (:lowStockOnly = false OR pv.stockQuantity <= 10) ORDER BY pv.stockQuantity ASC")
    org.springframework.data.domain.Page<ProductVariant> findInventoryVariants(
            @Param("lowStockOnly") boolean lowStockOnly,
            org.springframework.data.domain.Pageable pageable
    );

    @Query("SELECT COUNT(pv) FROM ProductVariant pv WHERE pv.stockQuantity <= :threshold AND pv.active = true")
    long countLowStock(@Param("threshold") int threshold);

    @Query("SELECT COUNT(pv) FROM ProductVariant pv WHERE pv.stockQuantity = 0 AND pv.active = true")
    long countOutOfStock();
}
