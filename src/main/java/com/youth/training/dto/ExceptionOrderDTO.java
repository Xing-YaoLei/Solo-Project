package com.youth.training.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExceptionOrderDTO {

    private String exceptionType;

    private String priority;

    private String title;

    private String description;

    private Long studentId;

    private Long courseId;

    private String impactScope;

    private String responsiblePerson;

    private String handlingDepartment;

    private Double completionRateBefore;

    private String createdBy;

    private LocalDateTime deadline;
}
