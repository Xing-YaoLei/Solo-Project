package com.trial.booking.controller;

import com.trial.booking.common.ApiResponse;
import com.trial.booking.dto.BatchCheckInRequest;
import com.trial.booking.dto.CheckInRequest;
import com.trial.booking.entity.AttendanceRecord;
import com.trial.booking.security.SecurityUtils;
import com.trial.booking.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/appointments/{id}/check-in")
    public ApiResponse<AttendanceRecord> checkIn(
            @PathVariable Long id,
            @RequestBody CheckInRequest request) {
        if (!SecurityUtils.hasAnyRole("ADMIN", "RECEPTIONIST", "PRINCIPAL")) {
            return ApiResponse.error(403, "无权限操作");
        }
        Long operatorId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(attendanceService.checkIn(id, request.getStatus(), operatorId));
    }

    @PostMapping("/appointments/batch-check-in")
    public ApiResponse<List<AttendanceRecord>> batchCheckIn(@RequestBody BatchCheckInRequest request) {
        if (!SecurityUtils.hasAnyRole("ADMIN", "RECEPTIONIST", "PRINCIPAL")) {
            return ApiResponse.error(403, "无权限操作");
        }
        Long operatorId = SecurityUtils.getCurrentUserId();
        return ApiResponse.success(attendanceService.batchCheckIn(request.getIds(), request.getStatus(), operatorId));
    }

    @GetMapping("/attendance/rate")
    public ApiResponse<Map<String, Object>> getAttendanceRate(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String campus) {
        String effectiveStart = startDate;
        String effectiveEnd = endDate;
        if (date != null && !date.isEmpty()) {
            effectiveStart = date;
            effectiveEnd = date;
        }
        return ApiResponse.success(attendanceService.getAttendanceRate(effectiveStart, effectiveEnd, campus));
    }
}
