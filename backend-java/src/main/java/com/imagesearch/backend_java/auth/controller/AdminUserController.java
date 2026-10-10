package com.imagesearch.backend_java.auth.controller;

import com.imagesearch.backend_java.auth.common.UserRole;
import com.imagesearch.backend_java.auth.common.UserStatus;
import com.imagesearch.backend_java.auth.dto.AdminUserDetailDto;
import com.imagesearch.backend_java.auth.dto.BaseResponse;
import com.imagesearch.backend_java.auth.dto.UserDto;
import com.imagesearch.backend_java.auth.dto.request.UpdateUserRoleRequest;
import com.imagesearch.backend_java.auth.dto.request.UpdateUserStatusRequest;
import com.imagesearch.backend_java.auth.service.AdminUserService;
import com.imagesearch.backend_java.index.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin Users", description = "Admin APIs for managing user accounts and roles")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
@Slf4j(topic = "ADMIN-USER-CONTROLLER")
public class AdminUserController {
    private final AdminUserService adminUserService;

    @Operation(summary = "Get users", description = "API returns paginated user list with optional role/status filters")
    @GetMapping
    public ResponseEntity<BaseResponse<PageResponse<UserDto>>> getUsers(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) UserRole role,
            @RequestParam(required = false) UserStatus status
    ) {
        log.info(
                "GET /admin/users: Fetch paginated user list, page={}, size={}, role={}, status={}",
                page,
                size,
                role,
                status
        );
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(BaseResponse.success(adminUserService.getUsers(pageable, role, status)));
    }

    @Operation(summary = "Get user detail", description = "API returns detailed profile of a single user")
    @GetMapping("/{id}")
    public ResponseEntity<BaseResponse<AdminUserDetailDto>> getUserDetail(@PathVariable Long id) {
        log.info("GET /admin/users/{}: Fetch user detail", id);
        return ResponseEntity.ok(BaseResponse.success(adminUserService.getUserDetail(id)));
    }

    @Operation(summary = "Update user status", description = "API activates, suspends or blocks a user account")
    @PutMapping("/{id}/status")
    public ResponseEntity<BaseResponse<UserDto>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        log.info("PUT /admin/users/{}/status: Update status to {}", id, request.getStatus());
        return ResponseEntity.ok(BaseResponse.success(adminUserService.updateUserStatus(id, request.getStatus())));
    }

    @Operation(summary = "Update user role", description = "API promotes or demotes a user role")
    @PutMapping("/{id}/role")
    public ResponseEntity<BaseResponse<UserDto>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        log.info("PUT /admin/users/{}/role: Update role to {}", id, request.getRole());
        return ResponseEntity.ok(BaseResponse.success(adminUserService.updateUserRole(id, request.getRole())));
    }
}
