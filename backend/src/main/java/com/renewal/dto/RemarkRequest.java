package com.renewal.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class RemarkRequest {

    private Long triggerLogId;
    private String remark;
    private String operator;
}
