package com.usedcar.acquisition.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("vehicle_archive")
public class VehicleArchive implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String vin;
    private String plateNo;
    private String brand;
    private String series;
    private String model;
    private String color;
    private LocalDate registerDate;
    private Integer mileage;
    private String emissionStandard;
    private String transmission;
    private BigDecimal displacement;
    private String fuelType;
    private String bodyType;
    private String driveType;
    private String engineNo;
    private Integer hasInsurance;
    private LocalDate insuranceExpire;
    private Integer hasAnnualInspection;
    private LocalDate annualInspectionExpire;
    private String vehicleUsage;
    private String ownerName;
    private String ownerPhone;
    private String ownerIdCard;
    private String remark;
    @TableLogic
    private Integer deleted;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
