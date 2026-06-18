package com.usedcar.dashboard.service;

import com.usedcar.dashboard.dto.DashboardFilter;
import com.usedcar.dashboard.dto.DashboardOverview;
import com.usedcar.dashboard.dto.InspectionReportComposition;
import com.usedcar.dashboard.dto.PrepListDetail;
import com.usedcar.dashboard.dto.TestDriveAnomaly;
import com.usedcar.dashboard.dto.VehicleArchiveTrend;

import java.util.List;

public interface DashboardService {

    DashboardOverview getOverview(DashboardFilter filter, String shareToken);

    List<VehicleArchiveTrend> getVehicleTrend(DashboardFilter filter, String shareToken);

    InspectionReportComposition getInspectionReport(DashboardFilter filter, String shareToken);

    PrepListDetail getPrepList(DashboardFilter filter, String shareToken);

    TestDriveAnomaly getTestDriveAnomaly(DashboardFilter filter, String shareToken);
}
