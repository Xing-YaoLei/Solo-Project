package com.secondhand.funnel.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.List;

@Data
public class FunnelStatsDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long totalCars;
    private Long listedCars;
    private Long soldCars;
    private Long totalAnomalies;
    private List<FunnelStageStatsDTO> stageStats;
    private Double conversionRate;
    private Integer avgDaysInInventory;
}
