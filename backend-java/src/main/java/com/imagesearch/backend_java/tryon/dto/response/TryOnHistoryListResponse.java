package com.imagesearch.backend_java.tryon.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TryOnHistoryListResponse {
    private List<TryOnHistoryItem> results;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
}
