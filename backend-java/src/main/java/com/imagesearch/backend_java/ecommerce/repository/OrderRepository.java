package com.imagesearch.backend_java.ecommerce.repository;

import com.imagesearch.backend_java.auth.entity.User;
import com.imagesearch.backend_java.ecommerce.entity.Order;
import com.imagesearch.backend_java.ecommerce.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    Page<Order> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Order> findByOrderStatusOrderByCreatedAtDesc(OrderStatus orderStatus, Pageable pageable);

    long countByOrderStatus(OrderStatus orderStatus);

    long countByUserId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus <> 'CANCELLED'")
    java.math.BigDecimal sumTotalRevenue();
}
