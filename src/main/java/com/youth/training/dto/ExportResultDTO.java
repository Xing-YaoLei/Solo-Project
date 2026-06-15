package com.youth.training.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportResultDTO {

    private String fileName;

    private String dataCaliber;

    private LocalDateTime exportTime;

    private Integer recordCount;
}
