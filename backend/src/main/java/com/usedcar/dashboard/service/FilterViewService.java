package com.usedcar.dashboard.service;

import com.usedcar.dashboard.dto.FilterView;

import java.util.List;

public interface FilterViewService {

    List<FilterView> getAllViews();

    FilterView getByViewId(String viewId);

    FilterView getDefaultView();

    FilterView createView(FilterView view);

    FilterView updateView(FilterView view);

    void deleteView(Long id);

    void setDefault(String viewId);
}
