package com.usedcar.dashboard.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleSource {

    private Long id;
    private String vehicleId;
    private String storeId;
    private String brand;
    private String model;
    private String vehicleCondition;
    private String sourceType;
    private String inspectionReportId;
    private String financeStatus;
    private BigDecimal purchasePrice;
    private BigDecimal listingPrice;
    private Integer mileage;
    private Integer turnoverDays;
    private Integer testDriveCount;
    private Integer abnormalCount;
    private LocalDate registerDate;
    private LocalDateTime listedDate;
    private LocalDateTime delistedDate;
    private LocalDateTime soldDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer inspectionStatus;
    private Integer prepStatus;
}
