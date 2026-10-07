package com.imagesearch.backend_java.auth.dto.request;

import com.imagesearch.backend_java.auth.common.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserStatusRequest {
    @NotNull(message = "Trạng thái người dùng không được để trống")
    private UserStatus status;
}
