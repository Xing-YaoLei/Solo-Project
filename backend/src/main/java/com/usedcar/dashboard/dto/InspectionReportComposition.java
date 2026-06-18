package com.usedcar.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionReportComposition implements Serializable {

    private static final long serialVersionUID = 1L;

    private Integer totalReports;
    private Map<String, Integer> categoryDistribution;
    private List<Map<String, Object>> categoryDetails;
    private Double passRate;
}
