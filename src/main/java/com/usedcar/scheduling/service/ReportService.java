package com.usedcar.scheduling.service;

import com.usedcar.scheduling.dto.DashboardDTO;
import com.usedcar.scheduling.dto.ReportDTO;
import com.usedcar.scheduling.enums.UserRole;

import java.time.LocalDate;

public interface ReportService {

    DashboardDTO getDashboardData(Long storeId, UserRole userRole, Long currentUserId);

    ReportDTO getInventoryReport(LocalDate startDate, LocalDate endDate, Long storeId, UserRole userRole, Long currentUserId);

    ReportDTO getPersonReport(LocalDate startDate, LocalDate endDate, Long personId, UserRole userRole, Long currentUserId);

    ReportDTO getDateDrilldownReport(LocalDate startDate, LocalDate endDate, UserRole userRole, Long currentUserId);
}
