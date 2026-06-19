package com.usedcar.scheduling.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class QuotationDTO {

    private Long id;
    private Long vehicleId;
    private String vehicleVin;
    private String vehicleInfo;
    private BigDecimal quotationPrice;
    private String quotationType;
    private String operatorName;
    private String customerName;
    private String remark;
    private LocalDateTime createdAt;
}
