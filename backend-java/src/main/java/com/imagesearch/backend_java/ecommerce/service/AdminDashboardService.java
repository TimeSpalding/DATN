package com.imagesearch.backend_java.ecommerce.service;

import com.imagesearch.backend_java.auth.common.UserStatus;
import com.imagesearch.backend_java.auth.repository.UserRepository;
import com.imagesearch.backend_java.ecommerce.dto.AdminDashboardDTO;
import com.imagesearch.backend_java.ecommerce.dto.OrderDTO;
import com.imagesearch.backend_java.ecommerce.entity.Category;
import com.imagesearch.backend_java.ecommerce.enums.OrderStatus;
import com.imagesearch.backend_java.ecommerce.enums.ProductStatus;
import com.imagesearch.backend_java.ecommerce.repository.CategoryRepository;
import com.imagesearch.backend_java.ecommerce.repository.OrderRepository;
import com.imagesearch.backend_java.ecommerce.repository.ProductRepository;
import com.imagesearch.backend_java.ecommerce.repository.ProductVariantRepository;
import com.imagesearch.backend_java.image.enums.ImageIndexStatus;
import com.imagesearch.backend_java.image.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "ADMIN-DASHBOARD-SERVICE")
public class AdminDashboardService {

    private final OrderRepository orderRepository;
    private final OrderService orderService;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ImageRepository imageRepository;

    @Transactional(readOnly = true)
    public AdminDashboardDTO getOverview() {
        log.info("Computing enterprise admin dashboard overview metrics");

        // 1. Revenue & Orders
        BigDecimal totalRev = orderRepository.sumTotalRevenue();
        if (totalRev == null) totalRev = BigDecimal.ZERO;
        String formattedRev = ProductService.formatPriceVnd(totalRev);
        long totalOrders = orderRepository.count();

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        for (OrderStatus st : OrderStatus.values()) {
            statusCounts.put(st.name(), orderRepository.countByOrderStatus(st));
        }

        // 2. Products & Inventory
        long totalProducts = productRepository.count();
        long activeProducts = productRepository.countByStatus(ProductStatus.ACTIVE);
        long lowStock = productVariantRepository.countLowStock(10);
        long outOfStock = productVariantRepository.countOutOfStock();

        // 3. User metrics
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        long newUsers = userRepository.countByCreatedAtAfter(LocalDateTime.now().minusDays(30));

        // 4. Visual Search & AI index metrics
        Long indexedCount = imageRepository.countByIndexStatusAndDeletedFalse(ImageIndexStatus.INDEXED);
        Long pendingCount = imageRepository.countByIndexStatusAndDeletedFalse(ImageIndexStatus.PENDING);

        // 5. Recent 5 orders
        List<OrderDTO> recentOrders = orderRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
                .getContent().stream()
                .map(orderService::mapToOrderDTO)
                .collect(Collectors.toList());

        // 6. Category breakdown
        List<Category> categories = categoryRepository.findAll();
        List<AdminDashboardDTO.CategoryStatDTO> categoryStats = new ArrayList<>();
        for (Category cat : categories) {
            long count = productRepository.countByCategoryAndStatus(cat, ProductStatus.ACTIVE);
            categoryStats.add(AdminDashboardDTO.CategoryStatDTO.builder()
                    .categoryCode(cat.getCode())
                    .categoryName(cat.getName())
                    .productCount(count)
                    .build());
        }

        return AdminDashboardDTO.builder()
                .totalRevenue(totalRev)
                .totalRevenueFormatted(formattedRev)
                .totalOrders(totalOrders)
                .ordersByStatus(statusCounts)
                .totalProducts(totalProducts)
                .activeProducts(activeProducts)
                .lowStockCount(lowStock)
                .outOfStockCount(outOfStock)
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .newUsersThisMonth(newUsers)
                .totalIndexedImages(indexedCount != null ? indexedCount : 0L)
                .pendingImages(pendingCount != null ? pendingCount : 0L)
                .recentOrders(recentOrders)
                .categoryBreakdown(categoryStats)
                .build();
    }
}
