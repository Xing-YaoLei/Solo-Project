package com.usedcar.acquisition.dto;

import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Data
public class TaskCreateDTO implements Serializable {
    private String vin;
    private String plateNo;
    private String brand;
    private String series;
    private String model;
    private String color;
    private String registerDate;
    private Integer mileage;
    private String emissionStandard;
    private String transmission;
    private BigDecimal displacement;
    private String fuelType;
    private String bodyType;
    private String ownerName;
    private String ownerPhone;
    private String sourceType;
    private String sourceDetail;
    private String customerName;
    private String customerPhone;
    private Long assessorId;
    private Long salesId;
    private Long managerId;
    private BigDecimal expectedPrice;
    private String vehicleStatus;
    private String remark;
    private Long createBy;
}
