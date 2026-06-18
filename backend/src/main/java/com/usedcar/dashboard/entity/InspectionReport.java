package com.usedcar.dashboard.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionReport {

    private Long id;
    private String reportId;
    private String vehicleId;
    private String storeId;
    private String inspector;
    private String category;
    private String description;
    private LocalDateTime inspectionDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private BigDecimal overallScore;
    private Integer defectCount;
    private Integer hasAccident;
    private Integer hasFlood;
    private Integer hasFire;
    private String defectDetails;
}
