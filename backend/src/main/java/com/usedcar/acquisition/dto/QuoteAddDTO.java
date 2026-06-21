package com.usedcar.acquisition.dto;

import lombok.Data;
import java.io.Serializable;
import java.math.BigDecimal;

@Data
public class QuoteAddDTO implements Serializable {
    private Long taskId;
    private String quoteType;
    private BigDecimal quotePrice;
    private Long quoteBy;
    private String customerResponse;
    private BigDecimal customerCounterPrice;
    private String remark;
}
