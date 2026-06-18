package com.usedcar.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestDriveAnomaly implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer totalDrives;
    private Integer abnormalCount;
    private List<DailyDriveDistribution> dailyDistribution;
    private List<AnomalyItem> anomalies;
}
