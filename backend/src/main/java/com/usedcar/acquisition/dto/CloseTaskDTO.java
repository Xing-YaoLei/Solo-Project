package com.usedcar.acquisition.dto;

import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CloseTaskDTO implements Serializable {
    private Long taskId;
    private String closeType;
    private String closeReason;
    private BigDecimal finalPrice;
    private Long operatorId;
    private LocalDate inboundDate;
    private BigDecimal expectedSalePrice;
    private String warehouseLocation;
}
