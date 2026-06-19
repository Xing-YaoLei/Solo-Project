package com.usedcar.scheduling.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PreparationDTO {

    private Long id;
    private Long vehicleId;
    private String vehicleVin;
    private String itemName;
    private String status;
    private String operatorName;
    private LocalDateTime completedAt;
    private String remark;
}
