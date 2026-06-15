package com.renewal.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ThresholdConfigDTO {

    private Long id;
    private String configKey;
    private String configName;
    private BigDecimal configValue;
    private String configUnit;
    private String configGroup;
    private String description;
    private String updatedBy;
}
