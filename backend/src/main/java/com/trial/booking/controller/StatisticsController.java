package com.trial.booking.controller;

import com.trial.booking.common.ApiResponse;
import com.trial.booking.common.PageResult;
import com.trial.booking.entity.Appointment;
import com.trial.booking.security.SecurityUtils;
import com.trial.booking.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/attendance-rate")
    public ApiResponse<List<Map<String, Object>>> getAttendanceRate(
            @RequestParam(defaultValue = "campus") String dimension,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ApiResponse.success(statisticsService.getAttendanceRate(dimension, startDate, endDate));
    }

    @GetMapping("/trend")
    public ApiResponse<Map<String, Object>> getTrend(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ApiResponse.success(statisticsService.getTrend(startDate, endDate));
    }

    @GetMapping("/drill-down")
    public ApiResponse<PageResult<Appointment>> drillDown(
            @RequestParam String dimension,
            @RequestParam String dimensionValue,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int pageSize) {
        return ApiResponse.success(statisticsService.drillDown(dimension, dimensionValue, startDate, endDate, page, pageSize));
    }
}
