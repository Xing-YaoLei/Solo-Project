package com.renewal.dto;

import lombok.Data;

@Data
public class DataImportResultDTO {

    private Long logId;
    private String batchId;
    private int rawCount;
    private int cleanedCount;
    private int duplicateCount;
    private int mismatchCount;
    private String status;
    private String errorMessage;
}
