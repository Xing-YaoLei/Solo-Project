package com.usedcar.scheduling.dto;

import com.usedcar.scheduling.domain.VehicleArchive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardDTO {

    private Long totalVehicles;
    private Long listedVehicles;
    private Long preparingVehicles;
    private Long soldVehicles;
    private Long pendingTodos;
    private Long overdueTodos;
    private Long todayListings;
    private BigDecimal inventoryTurnoverRate;
    private List<VehicleArchive> recentActivities;
}
