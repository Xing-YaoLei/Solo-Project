package com.youth.training.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatusChangeDTO {

    private Long businessId;

    private String businessType;

    private String oldStatus;

    private String newStatus;

    private String changeReason;

    private String operator;
}
