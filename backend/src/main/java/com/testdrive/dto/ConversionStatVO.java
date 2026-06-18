package com.testdrive.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ConversionStatVO {
    private String category;
    private Long total;
    private Long converted;
    private BigDecimal rate;
}
