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
public class DashboardOverview implements Serializable {

    private static final long serialVersionUID = 1L;

    private String lastRefreshTime;
    private DataSources dataSources;
    private Summary summary;
    private InventoryTurnoverMetrics turnover;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataSources implements Serializable {

        private static final long serialVersionUID = 1L;

        private DataSourceStatus inspection;
        private DataSourceStatus finance;
        private DataSourceStatus inventory;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataSourceStatus implements Serializable {

        private static final long serialVersionUID = 1L;

        private String status;
        private String lastSync;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Summary implements Serializable {

        private static final long serialVersionUID = 1L;

        private Integer totalListed;
        private Double weekOverWeek;
        private Double monthOverMonth;
        private Double inspectionPassRate;
        private Double avgPrepDays;
        private Integer abnormalTestDrives;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InventoryTurnoverMetrics implements Serializable {

        private static final long serialVersionUID = 1L;

        private Double avgTurnoverDays;
        private Double turnoverRate;
        private Integer fastMovingCount;
        private Integer slowMovingCount;
        private String definition;
    }
}
