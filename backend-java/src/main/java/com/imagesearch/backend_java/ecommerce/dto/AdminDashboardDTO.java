package com.imagesearch.backend_java.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardDTO {
    // Revenue & Order metrics
    private BigDecimal totalRevenue;
    private String totalRevenueFormatted;
    private long totalOrders;
    private Map<String, Long> ordersByStatus;

    // Product & Inventory metrics
    private long totalProducts;
    private long activeProducts;
    private long lowStockCount;
    private long outOfStockCount;

    // Customer metrics
    private long totalUsers;
    private long activeUsers;
    private long newUsersThisMonth;

    // AI & Search stats
    private long totalIndexedImages;
    private long pendingImages;

    // Recent data
    private List<OrderDTO> recentOrders;
    private List<CategoryStatDTO> categoryBreakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryStatDTO {
        private String categoryCode;
        private String categoryName;
        private long productCount;
    }
}
