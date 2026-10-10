package com.imagesearch.backend_java.auth.dto.request;

import com.imagesearch.backend_java.auth.common.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRoleRequest {
    @NotNull(message = "Vai trò người dùng không được để trống")
    private UserRole role;
}
