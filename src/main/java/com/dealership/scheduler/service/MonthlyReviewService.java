package com.dealership.scheduler.service;

import com.dealership.scheduler.dto.MonthlyReviewDTO;
import com.dealership.scheduler.dto.ReviewQueryDTO;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public interface MonthlyReviewService {
    MonthlyReviewDTO generateReview(ReviewQueryDTO query, String operatorName);
    void exportToExcel(ReviewQueryDTO query, String operatorName, HttpServletResponse response) throws IOException;
}
