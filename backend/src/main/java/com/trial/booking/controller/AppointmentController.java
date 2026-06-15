package com.trial.booking.controller;

import com.trial.booking.common.ApiResponse;
import com.trial.booking.common.PageResult;
import com.trial.booking.dto.AppointmentDTO;
import com.trial.booking.entity.Appointment;
import com.trial.booking.entity.ChangeLog;
import com.trial.booking.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST', 'PARENT')")
    public ApiResponse<Appointment> create(@Valid @RequestBody AppointmentDTO.CreateRequest request) {
        return ApiResponse.success(appointmentService.create(request));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResult<Appointment>> search(AppointmentDTO.SearchParams params) {
        return ApiResponse.success(appointmentService.search(params));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Appointment> getById(@PathVariable Long id) {
        return ApiResponse.success(appointmentService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<Appointment> update(@PathVariable Long id,
                                           @Valid @RequestBody AppointmentDTO.UpdateRequest request) {
        return ApiResponse.success(appointmentService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        appointmentService.delete(id);
        return ApiResponse.success();
    }

    @PostMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<Appointment> reschedule(@PathVariable Long id,
                                               @Valid @RequestBody AppointmentDTO.RescheduleRequest request) {
        return ApiResponse.success(appointmentService.reschedule(id, request));
    }

    @GetMapping("/conflicts")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<Appointment>> getConflicts(AppointmentDTO.ConflictParams params) {
        return ApiResponse.success(appointmentService.detectConflicts(params));
    }

    @PutMapping("/batch-status")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<Void> batchStatus(@Valid @RequestBody AppointmentDTO.BatchStatusRequest request) {
        appointmentService.batchStatus(request);
        return ApiResponse.success();
    }

    @PutMapping("/batch-confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<List<Appointment>> batchConfirm(@Valid @RequestBody AppointmentDTO.BatchIdsRequest request) {
        return ApiResponse.success(appointmentService.batchConfirm(request));
    }

    @PutMapping("/batch-cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'RECEPTIONIST')")
    public ApiResponse<List<Appointment>> batchCancel(@Valid @RequestBody AppointmentDTO.BatchIdsRequest request) {
        return ApiResponse.success(appointmentService.batchCancel(request));
    }

    @GetMapping("/{id}/change-log")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<List<ChangeLog>> getChangeLog(@PathVariable Long id) {
        return ApiResponse.success(appointmentService.getChangeLog(id));
    }

    @GetMapping("/change-logs")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PageResult<ChangeLog>> getAllChangeLogs(AppointmentDTO.ChangeLogSearchParams params) {
        return ApiResponse.success(appointmentService.getAllChangeLogs(params));
    }
}
