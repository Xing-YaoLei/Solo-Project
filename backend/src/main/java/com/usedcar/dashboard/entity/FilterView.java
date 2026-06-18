package com.usedcar.dashboard.entity;

import com.usedcar.dashboard.dto.DashboardFilter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FilterView {

    private Long id;
    private String viewId;
    private String name;
    private String creator;
    private Integer isDefault;
    private DashboardFilter filtersJson;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
