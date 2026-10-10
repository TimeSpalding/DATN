package com.imagesearch.backend_java.auth.dto;

import com.imagesearch.backend_java.auth.common.UserRole;
import com.imagesearch.backend_java.auth.common.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailDto {
    private Long id;
    private String username;
    private String email;
    private UserRole role;
    private UserStatus status;
    private long totalOrders;
    private long totalImages;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
