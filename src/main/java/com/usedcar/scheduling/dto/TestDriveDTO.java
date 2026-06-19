package com.usedcar.scheduling.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TestDriveDTO {

    private Long id;
    private Long vehicleId;
    private String vehicleVin;
    private String customerName;
    private String customerPhone;
    private LocalDate driveDate;
    private Long mileageBefore;
    private Long mileageAfter;
    private String feedback;
    private String salesName;
}
