package com.renewal.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class FunnelDashboardDTO {

    private List<FunnelStageItem> stages;
    private FunnelSummary summary;

    @Data
    public static class FunnelStageItem {
        private String stage;
        private String stageLabel;
        private long count;
        private BigDecimal conversionRate;
        private BigDecimal cumulativeRate;
    }

    @Data
    public static class FunnelSummary {
        private long totalEnrollments;
        private long renewedCount;
        private long lostCount;
        private BigDecimal overallRenewalRate;
        private BigDecimal overallCompletionRate;
    }
}
