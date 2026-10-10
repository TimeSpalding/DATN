package com.imagesearch.backend_java.ecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDTO {
    private Long id;
    private String code;
    private String name;
    private Long parentId;
    private Boolean active;
    private Integer sortOrder;
    private Long productCount;
}
