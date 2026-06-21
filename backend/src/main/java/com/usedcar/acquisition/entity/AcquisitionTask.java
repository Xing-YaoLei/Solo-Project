package com.usedcar.acquisition.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("acquisition_task")
public class AcquisitionTask implements Serializable {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String taskNo;
    private Long vehicleId;
    private String sourceType;
    private String sourceDetail;
    private String customerName;
    private String customerPhone;
    private Long assessorId;
    private Long salesId;
    private Long managerId;
    private BigDecimal expectedPrice;
    private BigDecimal finalPrice;
    private String vehicleStatus;
    private String taskStatus;
    private String closeType;
    private String closeReason;
    private String missingMaterials;
    private String escalateReason;
    private String escalateTargetRole;
    private Integer inventoryDays;
    private Integer isActive;
    private Long createBy;
    @TableLogic
    private Integer deleted;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private LocalDateTime closeTime;
}
