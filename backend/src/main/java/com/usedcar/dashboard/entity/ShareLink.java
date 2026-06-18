package com.usedcar.dashboard.entity;

import com.usedcar.dashboard.dto.DashboardFilter;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareLink {

    private Long id;
    private String token;
    private String viewId;
    private DashboardFilter filtersJson;
    private List<String> permissionsJson;
    private String creator;
    private Integer includesTurnoverMetrics;
    private Integer isValid;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime revokedAt;
}
