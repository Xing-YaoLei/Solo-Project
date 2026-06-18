package com.usedcar.dashboard.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestDrive {

    private Long id;
    private String driveId;
    private String vehicleId;
    private String storeId;
    private String driverName;
    private String driverPhone;
    private String routePlanned;
    private String routeActual;
    private String anomalyType;
    private String anomalySeverity;
    private String anomalyDesc;
    private String reportStatus;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer durationMin;
    private Integer maxSpeed;
    private Integer speedLimit;
    private Integer isAbnormal;
}
