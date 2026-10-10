package com.imagesearch.backend_java.ecommerce.service;

import com.imagesearch.backend_java.auth.entity.User;
import com.imagesearch.backend_java.auth.repository.UserRepository;
import com.imagesearch.backend_java.ecommerce.dto.CheckoutRequest;
import com.imagesearch.backend_java.ecommerce.dto.OrderDTO;
import com.imagesearch.backend_java.ecommerce.dto.OrderItemDTO;
import com.imagesearch.backend_java.ecommerce.dto.UpdateOrderStatusRequest;
import com.imagesearch.backend_java.ecommerce.entity.*;
import com.imagesearch.backend_java.ecommerce.enums.OrderStatus;
import com.imagesearch.backend_java.ecommerce.enums.PaymentMethod;
import com.imagesearch.backend_java.ecommerce.enums.PaymentStatus;
import com.imagesearch.backend_java.ecommerce.repository.CartRepository;
import com.imagesearch.backend_java.ecommerce.repository.OrderRepository;
import com.imagesearch.backend_java.ecommerce.repository.ProductVariantRepository;
import com.imagesearch.backend_java.index.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public OrderDTO checkout(String username, CheckoutRequest request) {
        log.info("Processing checkout for user: {}, recipient: {}", username, request.getRecipientName());

        User user = null;
        if (username != null && !username.isBlank()) {
            user = userRepository.findByUsername(username).orElse(null);
        }

        List<OrderCheckoutItem> itemsToOrder = new ArrayList<>();

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (CheckoutRequest.CheckoutItemRequest itemReq : request.getItems()) {
                itemsToOrder.add(new OrderCheckoutItem(itemReq.getVariantId(), itemReq.getQuantity()));
            }
        } else if (user != null) {
            Cart cart = cartRepository.findByUser(user).orElse(null);
            if (cart != null && !cart.getItems().isEmpty()) {
                for (CartItem ci : cart.getItems()) {
                    itemsToOrder.add(new OrderCheckoutItem(ci.getVariant().getId(), ci.getQuantity()));
                }
            }
        }

        if (itemsToOrder.isEmpty()) {
            throw new IllegalArgumentException("Giỏ hàng rỗng. Không thể tiến hành đặt hàng.");
        }

        String orderNumber = "ORD-" + (100000 + random.nextInt(900000));
        Order order = Order.builder()
                .user(user)
                .orderNumber(orderNumber)
                .recipientName(request.getRecipientName())
                .phoneNumber(request.getPhoneNumber())
                .shippingAddress(request.getShippingAddress())
                .notes(request.getNotes())
                .paymentMethod(parsePaymentMethod(request.getPaymentMethod()))
                .orderStatus(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .shippingFee(calculateShippingFee(request.getShippingMethod()))
                .discountAmount(calculateDiscount(request.getCouponCode()))
                .trackingNumber("VNPOST-" + (1000000 + random.nextInt(9000000)))
                .estimatedDelivery(LocalDate.now().plusDays(3))
                .items(new ArrayList<>())
                .build();

        BigDecimal subtotal = BigDecimal.ZERO;

        // Atomic inventory lock and deduction
        for (OrderCheckoutItem checkoutItem : itemsToOrder) {
            ProductVariant variant = productVariantRepository.findByIdWithLock(checkoutItem.variantId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy biến thể sản phẩm: " + checkoutItem.variantId));

            if (variant.getStockQuantity() < checkoutItem.quantity) {
                throw new IllegalStateException(String.format(
                        "Sản phẩm '%s' (Size %s, Màu %s) chỉ còn %d sản phẩm trong kho. Yêu cầu: %d.",
                        variant.getProduct().getName(),
                        variant.getSize(),
                        variant.getColor(),
                        variant.getStockQuantity(),
                        checkoutItem.quantity
                ));
            }

            // Deduct inventory
            variant.setStockQuantity(variant.getStockQuantity() - checkoutItem.quantity);
            productVariantRepository.save(variant);

            Product product = variant.getProduct();
            BigDecimal unitPrice = variant.getPriceOverride() != null ? variant.getPriceOverride() : product.getBasePrice();
            BigDecimal itemSubtotal = unitPrice.multiply(BigDecimal.valueOf(checkoutItem.quantity));
            subtotal = subtotal.add(itemSubtotal);

            String imageUrl = resolvePrimaryImageUrl(product);

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .variant(variant)
                    .productName(product.getName())
                    .productSku(variant.getSku())
                    .variantSize(variant.getSize())
                    .variantColor(variant.getColor())
                    .imageUrl(imageUrl)
                    .quantity(checkoutItem.quantity)
                    .unitPrice(unitPrice)
                    .subtotal(itemSubtotal)
                    .build();

            order.getItems().add(orderItem);
        }

        order.setSubtotal(subtotal);
        BigDecimal total = subtotal.add(order.getShippingFee()).subtract(order.getDiscountAmount());
        if (total.compareTo(BigDecimal.ZERO) < 0) {
            total = BigDecimal.ZERO;
        }
        order.setTotalAmount(total);

        Order savedOrder = orderRepository.save(order);
        log.info("Order placed successfully with orderNumber: {}, total: {}", orderNumber, total);

        // Clear user cart if ordered from cart
        if (user != null && (request.getItems() == null || request.getItems().isEmpty())) {
            cartRepository.findByUser(user).ifPresent(cart -> {
                cart.getItems().clear();
                cartRepository.save(cart);
            });
        }

        return mapToOrderDTO(savedOrder);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderDTO> getUserOrders(String username, int page, int size) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        int pageIndex = Math.max(0, page);
        int pageSize = Math.max(1, size);
        Pageable pageable = PageRequest.of(pageIndex, pageSize);

        Page<Order> orderPage = orderRepository.findByUserOrderByCreatedAtDesc(user, pageable);
        List<OrderDTO> dtoList = orderPage.getContent().stream()
                .map(this::mapToOrderDTO)
                .collect(Collectors.toList());

        return PageResponse.of(dtoList, pageIndex, pageSize, orderPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public OrderDTO getOrderByNumber(String username, String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng: " + orderNumber));

        if (order.getUser() != null && !order.getUser().getUsername().equals(username)) {
            // Check if admin
            User user = userRepository.findByUsername(username).orElse(null);
            if (user == null || user.getRole() != com.imagesearch.backend_java.auth.common.UserRole.ADMIN) {
                throw new SecurityException("Không có quyền truy cập đơn hàng này");
            }
        }

        return mapToOrderDTO(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderDTO> getAllOrders(int page, int size) {
        int pageIndex = Math.max(0, page);
        int pageSize = Math.max(1, size);
        Pageable pageable = PageRequest.of(pageIndex, pageSize);

        Page<Order> orderPage = orderRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<OrderDTO> dtoList = orderPage.getContent().stream()
                .map(this::mapToOrderDTO)
                .collect(Collectors.toList());

        return PageResponse.of(dtoList, pageIndex, pageSize, orderPage.getTotalElements());
    }

    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with id: " + orderId));

        if (request.getOrderStatus() != null && !request.getOrderStatus().isBlank()) {
            order.setOrderStatus(OrderStatus.valueOf(request.getOrderStatus().toUpperCase()));
        }
        if (request.getPaymentStatus() != null && !request.getPaymentStatus().isBlank()) {
            order.setPaymentStatus(PaymentStatus.valueOf(request.getPaymentStatus().toUpperCase()));
        }
        if (request.getTrackingNumber() != null && !request.getTrackingNumber().isBlank()) {
            order.setTrackingNumber(request.getTrackingNumber());
        }

        return mapToOrderDTO(orderRepository.save(order));
    }

    public OrderDTO mapToOrderDTO(Order order) {
        List<OrderItemDTO> itemDTOs = order.getItems().stream().map(item -> OrderItemDTO.builder()
                .id(item.getId())
                .variantId(item.getVariant() != null ? item.getVariant().getId() : null)
                .name(item.getProductName())
                .sku(item.getProductSku())
                .size(item.getVariantSize())
                .color(item.getVariantColor())
                .price(item.getUnitPrice())
                .quantity(item.getQuantity())
                .image(item.getImageUrl())
                .subtotal(item.getSubtotal())
                .build()
        ).collect(Collectors.toList());

        OrderDTO.CustomerDTO customerDTO = OrderDTO.CustomerDTO.builder()
                .fullName(order.getRecipientName())
                .phone(order.getPhoneNumber())
                .email(order.getUser() != null ? order.getUser().getEmail() : "guest@example.com")
                .address(order.getShippingAddress())
                .build();

        return OrderDTO.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .createdAt(order.getCreatedAt())
                .orderStatus(order.getOrderStatus().name().toLowerCase())
                .paymentStatus(order.getPaymentStatus().name().toLowerCase())
                .paymentMethod(order.getPaymentMethod().name())
                .customer(customerDTO)
                .items(itemDTOs)
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .totalAmount(order.getTotalAmount())
                .trackingNumber(order.getTrackingNumber())
                .estimatedDelivery(order.getEstimatedDelivery())
                .notes(order.getNotes())
                .build();
    }

    private PaymentMethod parsePaymentMethod(String method) {
        if (method == null) return PaymentMethod.COD;
        try {
            return PaymentMethod.valueOf(method.toUpperCase());
        } catch (Exception e) {
            return PaymentMethod.COD;
        }
    }

    private BigDecimal calculateShippingFee(String shippingMethod) {
        if ("express".equalsIgnoreCase(shippingMethod)) {
            return BigDecimal.valueOf(35000);
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal calculateDiscount(String couponCode) {
        if (couponCode != null && couponCode.equalsIgnoreCase("ATELIER10")) {
            return BigDecimal.valueOf(100000); // 100k discount for demonstration
        }
        return BigDecimal.ZERO;
    }

    private String resolvePrimaryImageUrl(Product product) {
        if (product.getProductImages() == null || product.getProductImages().isEmpty()) {
            return "/samples/cloth-1.jpg";
        }
        return product.getProductImages().stream()
                .filter(ProductImage::getIsPrimary)
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(product.getProductImages().get(0).getImageUrl());
    }

    private static class OrderCheckoutItem {
        final Long variantId;
        final Integer quantity;

        OrderCheckoutItem(Long variantId, Integer quantity) {
            this.variantId = variantId;
            this.quantity = quantity != null && quantity > 0 ? quantity : 1;
        }
    }
}
