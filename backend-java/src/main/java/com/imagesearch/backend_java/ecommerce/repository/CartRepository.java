package com.imagesearch.backend_java.ecommerce.repository;

import com.imagesearch.backend_java.auth.entity.User;
import com.imagesearch.backend_java.ecommerce.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUser(User user);

    Optional<Cart> findByUserId(Long userId);
}
