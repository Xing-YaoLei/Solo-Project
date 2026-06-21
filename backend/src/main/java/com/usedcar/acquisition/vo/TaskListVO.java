package com.usedcar.acquisition.vo;

import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class TaskListVO implements Serializable {
    private Long id;
    private String taskNo;
    private Long vehicleId;
    private String sourceType;
    private String sourceTypeDesc;
    private String customerName;
    private String customerPhone;
    private String taskStatus;
    private String taskStatusDesc;
    private BigDecimal expectedPrice;
    private BigDecimal finalPrice;
    private String vehicleBrand;
    private String vehicleSeries;
    private String vehicleModel;
    private String plateNo;
    private String vin;
    private Long assessorId;
    private String assessorName;
    private Long salesId;
    private String salesName;
    private Long managerId;
    private String managerName;
    private Integer isActive;
    private LocalDateTime createTime;
    private LocalDateTime closeTime;
}
