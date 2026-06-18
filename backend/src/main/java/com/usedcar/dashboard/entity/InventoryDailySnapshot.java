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
public class InventoryDailySnapshot {

    private Long id;
    private LocalDate snapshotDate;
    private String storeId;
    private Integer openingCount;
    private Integer newListed;
    private Integer delisted;
    private Integer soldCount;
    private Integer closingCount;
    private Integer fastMovingCount;
    private Integer slowMovingCount;
    private BigDecimal avgTurnoverDays;
    private LocalDateTime createdAt;
}
