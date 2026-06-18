package com.usedcar.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardFilter {

    private List<String> storeIds;
    private String startDate;
    private String endDate;
    private List<String> brands;
    private List<String> sourceTypes;
    private List<String> vehicleCondition;
    private String viewId;

    public boolean hasViewId() {
        return viewId != null && !viewId.isBlank();
    }

    public boolean hasStoreFilter() {
        return storeIds != null && !storeIds.isEmpty();
    }

    public boolean hasDateRange() {
        return startDate != null && !startDate.isBlank() && endDate != null && !endDate.isBlank();
    }

    public boolean hasBrandFilter() {
        return brands != null && !brands.isEmpty();
    }

    public boolean hasSourceFilter() {
        return sourceTypes != null && !sourceTypes.isEmpty();
    }

    public boolean hasConditionFilter() {
        return vehicleCondition != null && !vehicleCondition.isEmpty();
    }
}
