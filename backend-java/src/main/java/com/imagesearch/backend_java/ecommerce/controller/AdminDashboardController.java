package com.imagesearch.backend_java.ecommerce.controller;

import com.imagesearch.backend_java.ecommerce.dto.AdminDashboardDTO;
import com.imagesearch.backend_java.ecommerce.service.AdminDashboardService;
import com.imagesearch.backend_java.search.dto.BaseResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
@RequiredArgsConstructor
@Slf4j(topic = "ADMIN-DASHBOARD-CONTROLLER")
@Tag(name = "Admin Analytics Dashboard", description = "Endpoints providing high-level business intelligence, orders, and inventory metrics")
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping("/overview")
    @Operation(summary = "Get admin dashboard overview metrics", description = "Aggregates revenue, order statuses, inventory warnings, user counts, and AI indexing metrics")
    public BaseResponse<AdminDashboardDTO> getOverview() {
        log.info("GET /admin/dashboard/overview: Fetch dashboard overview metrics");
        return BaseResponse.success(dashboardService.getOverview());
    }
}
