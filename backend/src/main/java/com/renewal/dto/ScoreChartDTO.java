package com.renewal.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class ScoreChartDTO {

    private Long enrollmentId;
    private String studentName;
    private String courseName;
    private List<ScoreDataPoint> dataPoints;
    private BigDecimal avgScore;
    private BigDecimal maxScore;
    private BigDecimal minScore;
    private BigDecimal dropRate;

    @Data
    public static class ScoreDataPoint {
        private LocalDate recordedAt;
        private String scoreType;
        private BigDecimal score;
        private BigDecimal maxScore;
        private String feedbackText;
    }
}
