package com.usedcar.scheduling.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Map;

@Data
public class ReportDTO {

    private String period;
    private Long totalVehicles;
    private Long soldVehicles;
    private BigDecimal avgDaysToSell;
    private BigDecimal inventoryTurnoverRate;
    private BigDecimal revenue;
    private Map<String, StoreReport> storeBreakdown;
    private Map<String, PersonReport> personBreakdown;

    @Data
    public static class StoreReport {

        private String storeName;
        private Long vehicleCount;
        private Long soldCount;
        private BigDecimal turnoverRate;
    }

    @Data
    public static class PersonReport {

        private String personName;
        private String roleName;
        private Long vehicleCount;
        private Long completedCount;
        private Long overdueCount;
    }
}
