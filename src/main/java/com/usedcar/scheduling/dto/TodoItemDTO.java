package com.usedcar.scheduling.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TodoItemDTO {

    private Long id;
    private Long vehicleId;
    private String vehicleVin;
    private String vehicleInfo;
    private String vehicleBrand;
    private String vehicleModel;
    private String todoType;
    private String status;
    private String title;
    private String description;
    private String assigneeName;
    private String creatorName;
    private LocalDate dueDate;
    private LocalDateTime completedAt;
    private String remark;
    private boolean overdue;
}
