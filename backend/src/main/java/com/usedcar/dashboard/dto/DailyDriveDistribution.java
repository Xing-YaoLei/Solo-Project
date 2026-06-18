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
public class DailyDriveDistribution implements Serializable {

    private static final long serialVersionUID = 1L;

    private String date;
    private Integer normalCount;
    private Integer abnormalCount;
}
