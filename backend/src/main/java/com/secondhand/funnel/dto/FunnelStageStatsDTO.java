package com.secondhand.funnel.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FunnelStageStatsDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String stage;
    private String stageName;
    private Long totalCount;
    private Long completedCount;
    private Long pendingCount;
    private Long anomalyCount;
}
