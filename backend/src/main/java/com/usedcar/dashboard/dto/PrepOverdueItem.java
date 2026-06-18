package com.usedcar.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrepOverdueItem implements Serializable {

    private static final long serialVersionUID = 1L;

    private String vehicleId;
    private String brand;
    private String model;
    private String financeApproval;
    private String status;
    private Integer prepDays;
    private Integer expectedDays;
}
