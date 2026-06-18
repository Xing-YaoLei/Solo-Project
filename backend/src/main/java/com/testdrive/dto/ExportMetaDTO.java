package com.testdrive.dto;

import lombok.Data;

@Data
public class ExportMetaDTO {
    private String filterCriteria;
    private String generatedAt;
    private String operator;
}
