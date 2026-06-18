package com.usedcar.dashboard.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrepItem {

    private Long id;
    private String vehicleId;
    private String storeId;
    private String itemName;
    private String itemCategory;
    private String status;
    private String remark;
    private BigDecimal cost;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer expectedDays;
    private Integer actualDays;
    private Integer isOverdue;
}
