package com.usedcar.scheduling.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FinanceDocumentDTO {

    private Long id;
    private Long vehicleId;
    private String vehicleVin;
    private String vehicleInfo;
    private String documentType;
    private String documentUrl;
    private String status;
    private String uploaderName;
    private LocalDateTime reviewedAt;
    private String remark;
}
