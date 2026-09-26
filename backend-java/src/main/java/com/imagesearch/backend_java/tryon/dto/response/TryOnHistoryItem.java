package com.imagesearch.backend_java.tryon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TryOnHistoryItem {
    private Long id;
    private String category;
    private String personImageUrl;
    private String clothImageUrl;
    private String resultImageUrl;
    private Long processingTimeMs;
    private LocalDateTime createdAt;
}
