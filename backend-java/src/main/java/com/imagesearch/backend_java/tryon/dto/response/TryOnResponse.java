package com.imagesearch.backend_java.tryon.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TryOnResponse {
    private Long historyId;
    private String resultImageUrl;
    private String category;
    private Long processingTimeMs;
    private LocalDateTime createdAt;
}
