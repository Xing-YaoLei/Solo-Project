package com.youth.training.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProgressDashboardDTO {

    private Long studentId;

    private String studentName;

    private Long courseId;

    private String courseName;

    private Double completionRate;

    private String status;

    private LocalDateTime lastStudyTime;

    private String warningLevel;
}
