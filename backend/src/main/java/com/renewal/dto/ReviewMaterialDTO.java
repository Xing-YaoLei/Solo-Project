package com.renewal.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ReviewMaterialDTO {

    private Long id;
    private String title;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private Integer totalEnrollments;
    private Integer renewedCount;
    private Integer lostCount;
    private java.math.BigDecimal overallCompletionRate;
    private String funnelSummary;
    private String anomalySummary;
    private String keyFindings;
    private String actionItems;
    private String status;
    private String createdBy;
}
