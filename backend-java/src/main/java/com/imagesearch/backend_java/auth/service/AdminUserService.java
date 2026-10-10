package com.imagesearch.backend_java.auth.service;

import com.imagesearch.backend_java.auth.common.UserRole;
import com.imagesearch.backend_java.auth.common.UserStatus;
import com.imagesearch.backend_java.auth.dto.AdminUserDetailDto;
import com.imagesearch.backend_java.auth.dto.UserDto;
import com.imagesearch.backend_java.auth.entity.User;
import com.imagesearch.backend_java.auth.mapper.UserMapper;
import com.imagesearch.backend_java.auth.repository.UserRepository;
import com.imagesearch.backend_java.ecommerce.repository.OrderRepository;
import com.imagesearch.backend_java.image.repository.ImageRepository;
import com.imagesearch.backend_java.index.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "ADMIN-USER-SERVICE")
public class AdminUserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final OrderRepository orderRepository;
    private final ImageRepository imageRepository;

    public PageResponse<UserDto> getUsers(Pageable pageable, UserRole role, UserStatus status) {
        log.info(
                "Entered getUsers service, page={}, size={}, role={}, status={}",
                pageable.getPageNumber(),
                pageable.getPageSize(),
                role,
                status
        );

        var usersPage = role != null && status != null
                ? userRepository.findAllByRoleAndStatusOrderByCreatedAtDesc(role, status, pageable)
                : role != null
                    ? userRepository.findAllByRoleOrderByCreatedAtDesc(role, pageable)
                    : status != null
                        ? userRepository.findAllByStatusOrderByCreatedAtDesc(status, pageable)
                        : userRepository.findAllByOrderByCreatedAtDesc(pageable);

        var users = usersPage.getContent()
                .stream()
                .map(userMapper::toDto)
                .toList();

        PageResponse<UserDto> response = PageResponse.of(
                users,
                usersPage.getNumber(),
                usersPage.getSize(),
                usersPage.getTotalElements()
        );

        log.info(
                "Completed getUsers service, page={}, size={}, totalElements={}",
                response.getPage(),
                response.getSize(),
                response.getTotalElements()
        );
        return response;
    }

    @Transactional(readOnly = true)
    public AdminUserDetailDto getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        long ordersCount = orderRepository.countByUserId(userId);
        Long imagesCount = imageRepository.countByUploadedByAndDeletedFalse(user);

        return AdminUserDetailDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .totalOrders(ordersCount)
                .totalImages(imagesCount != null ? imagesCount : 0L)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    @Transactional
    public UserDto updateUserStatus(Long userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        user.setStatus(status);
        User saved = userRepository.save(user);
        log.info("Updated user status for ID {} to {}", userId, status);
        return userMapper.toDto(saved);
    }

    @Transactional
    public UserDto updateUserRole(Long userId, UserRole role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
        user.setRole(role);
        User saved = userRepository.save(user);
        log.info("Updated user role for ID {} to {}", userId, role);
        return userMapper.toDto(saved);
    }
}
