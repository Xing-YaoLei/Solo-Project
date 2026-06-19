package com.usedcar.scheduling.service;

import com.usedcar.scheduling.dto.DashboardDTO;
import com.usedcar.scheduling.dto.ReportDTO;

import java.time.LocalDate;

public interface ReportService {

    DashboardDTO getDashboardData(Long storeId);

    ReportDTO getInventoryReport(LocalDate startDate, LocalDate endDate, Long storeId);

    ReportDTO getPersonReport(LocalDate startDate, LocalDate endDate, Long personId);

    ReportDTO getDateDrilldownReport(LocalDate startDate, LocalDate endDate);
}
