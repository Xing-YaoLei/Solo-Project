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
public class AnomalyItem implements Serializable {

    private static final long serialVersionUID = 1L;

    private String vehicleId;
    private String date;
    private String type;
    private String description;
    private String severity;
}
