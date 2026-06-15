package com.renewal.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EnrollmentDetailDTO {

    private Long enrollmentId;
    private Long studentId;
    private String studentName;
    private String parentPhone;
    private Long courseId;
    private String courseName;
    private LocalDate enrollDate;
    private LocalDate expireDate;
    private Integer currentChapter;
    private Integer totalChapters;
    private BigDecimal completionRate;
    private String currentStage;
    private BigDecimal latestScore;
    private BigDecimal avgScore;
    private Integer daysToExpire;
}
