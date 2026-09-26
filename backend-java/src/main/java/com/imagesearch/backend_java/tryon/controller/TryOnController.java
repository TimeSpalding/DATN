package com.imagesearch.backend_java.tryon.controller;

import com.imagesearch.backend_java.search.dto.BaseResponse;
import com.imagesearch.backend_java.tryon.dto.response.TryOnHistoryListResponse;
import com.imagesearch.backend_java.tryon.dto.response.TryOnResponse;
import com.imagesearch.backend_java.tryon.service.TryOnService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/tryon")
@RequiredArgsConstructor
@Slf4j(topic = "TRYON-CONTROLLER")
@Tag(name = "Virtual Try-On", description = "APIs for AI-powered virtual clothing try-on")
@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
@SecurityRequirement(name = "bearerAuth")
public class TryOnController {

    private final TryOnService tryOnService;

    @PostMapping(consumes = "multipart/form-data")
    @Operation(
            summary = "Try on a garment",
            description = "Uploads person and garment images, runs CatVTON AI model, saves result to MinIO and records history."
    )
    public BaseResponse<TryOnResponse> tryOn(
            @RequestParam("person_image") MultipartFile personImage,
            @RequestParam("cloth_image") MultipartFile clothImage,
            @RequestParam(value = "category", defaultValue = "overall") String category,
            Authentication authentication
    ) {
        log.info("POST /tryon: person={}, cloth={}, category={}",
                personImage.getOriginalFilename(), clothImage.getOriginalFilename(), category);
        TryOnResponse result = tryOnService.requestTryOn(username(authentication), personImage, clothImage, category);
        return BaseResponse.success(result);
    }

    @GetMapping("/history")
    @Operation(
            summary = "Get try-on history",
            description = "Returns paginated try-on history for the authenticated user."
    )
    public BaseResponse<TryOnHistoryListResponse> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication
    ) {
        log.info("GET /tryon/history: page={}, size={}", page, size);
        TryOnHistoryListResponse result = tryOnService.getHistory(username(authentication), page, size);
        return BaseResponse.success(result);
    }

    @DeleteMapping("/history/{historyId}")
    @Operation(
            summary = "Delete a try-on history record",
            description = "Deletes a single try-on history record belonging to the authenticated user."
    )
    public BaseResponse<Void> deleteHistory(
            @PathVariable Long historyId,
            Authentication authentication
    ) {
        log.info("DELETE /tryon/history/{}", historyId);
        tryOnService.deleteHistoryItem(username(authentication), historyId);
        return BaseResponse.success(null);
    }

    private String username(Authentication authentication) {
        return authentication == null ? null : authentication.getName();
    }
}
