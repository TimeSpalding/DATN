package com.imagesearch.backend_java.ecommerce.service;

import com.imagesearch.backend_java.auth.entity.User;
import com.imagesearch.backend_java.auth.repository.UserRepository;
import com.imagesearch.backend_java.ecommerce.dto.AddToCartRequest;
import com.imagesearch.backend_java.ecommerce.dto.CartDTO;
import com.imagesearch.backend_java.ecommerce.dto.CartItemDTO;
import com.imagesearch.backend_java.ecommerce.dto.UpdateCartItemRequest;
import com.imagesearch.backend_java.ecommerce.entity.Cart;
import com.imagesearch.backend_java.ecommerce.entity.CartItem;
import com.imagesearch.backend_java.ecommerce.entity.Product;
import com.imagesearch.backend_java.ecommerce.entity.ProductImage;
import com.imagesearch.backend_java.ecommerce.entity.ProductVariant;
import com.imagesearch.backend_java.ecommerce.repository.CartItemRepository;
import com.imagesearch.backend_java.ecommerce.repository.CartRepository;
import com.imagesearch.backend_java.ecommerce.repository.ProductRepository;
import com.imagesearch.backend_java.ecommerce.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional
    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUser(user).orElseGet(() -> {
            Cart newCart = Cart.builder()
                    .user(user)
                    .items(new ArrayList<>())
                    .build();
            return cartRepository.save(newCart);
        });
    }

    @Transactional(readOnly = true)
    public CartDTO getCart(String username) {
        User user = getUser(username);
        Cart cart = getOrCreateCart(user);
        return mapToCartDTO(cart);
    }

    @Transactional
    public CartDTO addToCart(String username, AddToCartRequest request) {
        User user = getUser(username);
        Cart cart = getOrCreateCart(user);

        ProductVariant variant = resolveVariant(request);

        if (variant.getStockQuantity() <= 0) {
            throw new IllegalStateException("Sản phẩm phiên bản " + variant.getSize() + " đã hết hàng");
        }

        int requestedQty = request.getQuantity() != null && request.getQuantity() > 0 ? request.getQuantity() : 1;

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartAndVariant(cart, variant);

        if (existingItemOpt.isPresent()) {
            CartItem existing = existingItemOpt.get();
            int newQty = existing.getQuantity() + requestedQty;
            if (newQty > variant.getStockQuantity()) {
                newQty = variant.getStockQuantity();
            }
            existing.setQuantity(newQty);
            cartItemRepository.save(existing);
        } else {
            if (requestedQty > variant.getStockQuantity()) {
                requestedQty = variant.getStockQuantity();
            }
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .variant(variant)
                    .quantity(requestedQty)
                    .addedAt(LocalDateTime.now())
                    .build();
            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        return mapToCartDTO(cart);
    }

    @Transactional
    public CartDTO updateCartItem(String username, Long cartItemId, UpdateCartItemRequest request) {
        User user = getUser(username);
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found: " + cartItemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new SecurityException("Unauthorized cart access");
        }

        if (request.getQuantity() == null || request.getQuantity() <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
        } else {
            int newQty = request.getQuantity();
            if (newQty > item.getVariant().getStockQuantity()) {
                newQty = item.getVariant().getStockQuantity();
            }
            item.setQuantity(newQty);
            cartItemRepository.save(item);
        }

        return mapToCartDTO(cart);
    }

    @Transactional
    public CartDTO removeCartItem(String username, Long cartItemId) {
        User user = getUser(username);
        Cart cart = getOrCreateCart(user);

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found: " + cartItemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new SecurityException("Unauthorized cart access");
        }

        cart.getItems().remove(item);
        cartItemRepository.delete(item);

        return mapToCartDTO(cart);
    }

    @Transactional
    public void clearCart(String username) {
        User user = getUser(username);
        Cart cart = getOrCreateCart(user);
        cart.getItems().clear();
        cartItemRepository.deleteByCart(cart);
    }

    private ProductVariant resolveVariant(AddToCartRequest request) {
        if (request.getVariantId() != null) {
            return productVariantRepository.findById(request.getVariantId())
                    .orElseThrow(() -> new IllegalArgumentException("Variant not found: " + request.getVariantId()));
        }

        if (request.getProductId() != null) {
            Product product = productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + request.getProductId()));

            String targetSize = request.getSize() != null ? request.getSize().toUpperCase() : "M";
            String targetColor = request.getColor();

            return product.getVariants().stream()
                    .filter(v -> v.getSize().equalsIgnoreCase(targetSize) &&
                            (targetColor == null || v.getColor().equalsIgnoreCase(targetColor)))
                    .findFirst()
                    .orElse(product.getVariants().get(0));
        }

        throw new IllegalArgumentException("Variant ID or Product ID must be provided");
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
    }

    public CartDTO mapToCartDTO(Cart cart) {
        List<CartItemDTO> itemDTOs = cart.getItems().stream().map(item -> {
            ProductVariant variant = item.getVariant();
            Product product = variant.getProduct();
            BigDecimal price = variant.getPriceOverride() != null ? variant.getPriceOverride() : product.getBasePrice();
            BigDecimal subtotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));

            String image = product.getProductImages().stream()
                    .filter(ProductImage::getIsPrimary)
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(!product.getProductImages().isEmpty() ? product.getProductImages().get(0).getImageUrl() : "/samples/cloth-1.jpg");

            return CartItemDTO.builder()
                    .id(item.getId())
                    .productId(product.getId())
                    .productName(product.getName())
                    .sku(variant.getSku())
                    .variantId(variant.getId())
                    .size(variant.getSize())
                    .color(variant.getColor())
                    .colorHex(variant.getColorHex())
                    .price(price)
                    .image(image)
                    .quantity(item.getQuantity())
                    .subtotal(subtotal)
                    .inStock(variant.getStockQuantity() >= item.getQuantity())
                    .build();
        }).collect(Collectors.toList());

        BigDecimal total = itemDTOs.stream()
                .map(CartItemDTO::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalQty = itemDTOs.stream()
                .mapToInt(CartItemDTO::getQuantity)
                .sum();

        return CartDTO.builder()
                .id(cart.getId())
                .items(itemDTOs)
                .subtotal(total)
                .totalQuantity(totalQty)
                .build();
    }
}
