package com.renewal.service;

import com.renewal.dto.FunnelDashboardDTO;
import com.renewal.dto.EnrollmentDetailDTO;

import java.util.List;

public interface FunnelService {

    FunnelDashboardDTO getDashboard();

    List<EnrollmentDetailDTO> getEnrollmentDetails(String stage);
}
