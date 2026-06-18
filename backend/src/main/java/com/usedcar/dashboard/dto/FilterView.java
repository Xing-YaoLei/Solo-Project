package com.usedcar.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FilterView implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String viewId;
    private String name;
    private Boolean isDefault;
    private DashboardFilter filters;
    private String createdAt;
    private String updatedAt;
}
