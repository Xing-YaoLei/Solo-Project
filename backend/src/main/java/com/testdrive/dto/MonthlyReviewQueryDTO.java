package com.testdrive.dto;

import lombok.Data;

@Data
public class MonthlyReviewQueryDTO {
    private String yearMonth;
    private String salesPerson;
    private String leadSource;
    private String leadStatus;
}
