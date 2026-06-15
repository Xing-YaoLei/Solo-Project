package com.trial.booking.dto;

import lombok.Data;

import java.util.List;

@Data
public class BatchCheckInRequest {
    private List<Long> ids;
    private String status;
}
