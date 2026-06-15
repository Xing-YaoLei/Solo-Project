package com.renewal.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class ReviewGenerateRequest {

    private LocalDate periodStart;
    private LocalDate periodEnd;
    private String createdBy;
}
