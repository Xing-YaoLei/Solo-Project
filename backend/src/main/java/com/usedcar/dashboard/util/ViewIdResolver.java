package com.usedcar.dashboard.util;

import com.usedcar.dashboard.dto.DashboardFilter;
import com.usedcar.dashboard.dto.FilterView;
import com.usedcar.dashboard.service.FilterViewService;

public class ViewIdResolver {

    private ViewIdResolver() {
    }

    public static DashboardFilter resolve(FilterViewService filterViewService, DashboardFilter filter) {
        if (filter != null && filter.hasViewId()) {
            FilterView view = filterViewService.getByViewId(filter.getViewId());
            if (view != null && view.getFilters() != null) {
                DashboardFilter resolved = view.getFilters();
                resolved.setViewId(filter.getViewId());
                return resolved;
            }
        }
        return filter;
    }
}
