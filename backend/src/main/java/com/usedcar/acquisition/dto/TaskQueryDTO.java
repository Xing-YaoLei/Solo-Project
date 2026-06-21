package com.usedcar.acquisition.dto;

import com.usedcar.acquisition.common.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class TaskQueryDTO extends PageQuery implements Serializable {
    private String taskNo;
    private String taskStatus;
    private String sourceType;
    private String customerName;
    private String customerPhone;
    private Long assessorId;
    private Long salesId;
    private Long managerId;
    private String brand;
    private String plateNo;
    private String vin;
    private Integer isActive;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
