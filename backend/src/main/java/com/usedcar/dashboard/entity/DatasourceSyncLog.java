package com.usedcar.dashboard.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatasourceSyncLog {

    private Long id;
    private String sourceName;
    private String status;
    private String errorMessage;
    private LocalDateTime syncTime;
    private LocalDateTime createdAt;
    private Integer recordCount;
}
