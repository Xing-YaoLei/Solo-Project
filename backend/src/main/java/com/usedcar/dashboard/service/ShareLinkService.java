package com.usedcar.dashboard.service;

import com.usedcar.dashboard.dto.DashboardFilter;
import com.usedcar.dashboard.dto.ShareLink;
import com.usedcar.dashboard.dto.ShareLinkValidation;

import java.util.List;

public interface ShareLinkService {

    ShareLink createShareLink(List<String> permissions, boolean includesTurnoverMetrics,
                              DashboardFilter filter, String viewId);

    ShareLinkValidation validateShareLink(String token);
}
