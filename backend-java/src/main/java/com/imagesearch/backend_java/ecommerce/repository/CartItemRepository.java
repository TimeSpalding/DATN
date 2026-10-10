package com.imagesearch.backend_java.ecommerce.repository;

import com.imagesearch.backend_java.ecommerce.entity.Cart;
import com.imagesearch.backend_java.ecommerce.entity.CartItem;
import com.imagesearch.backend_java.ecommerce.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartAndVariant(Cart cart, ProductVariant variant);

    void deleteByCart(Cart cart);
}
