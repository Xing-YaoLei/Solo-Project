package com.usedcar.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrepListDetail implements Serializable {

    private static final long serialVersionUID = 1L;

    private Map<String, Integer> statusDistribution;
    private Double avgPrepDays;
    private List<PrepOverdueItem> overdueItems;
}
