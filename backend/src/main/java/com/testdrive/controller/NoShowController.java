package com.testdrive.controller;

import com.testdrive.entity.NoShowLog;
import com.testdrive.service.NoShowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/no-shows")
@RequiredArgsConstructor
public class NoShowController {

    private final NoShowService noShowService;

    @GetMapping("/alerts")
    public List<NoShowLog> getOpenAlerts(@RequestParam(required = false) String responsiblePerson) {
        return noShowService.getOpenNoShows(responsiblePerson);
    }

    @GetMapping("/appointment/{appointmentId}")
    public List<NoShowLog> getByAppointment(@PathVariable Long appointmentId) {
        return noShowService.getNoShowLogs(appointmentId);
    }

    @PostMapping("/mark/{appointmentId}")
    public ResponseEntity<NoShowLog> markNoShow(@PathVariable Long appointmentId) {
        return ResponseEntity.ok(noShowService.markAsNoShowByAppointmentId(appointmentId));
    }

    @PutMapping("/{logId}/handle")
    public ResponseEntity<NoShowLog> handle(@PathVariable Long logId,
                                             @RequestParam String reason,
                                             @RequestParam String handleAction,
                                             @RequestParam String closedBy) {
        return ResponseEntity.ok(noShowService.handleNoShow(logId, reason, handleAction, closedBy));
    }

    @GetMapping("/has-alert")
    public boolean hasAlert(@RequestParam String responsiblePerson) {
        return noShowService.hasAlert(responsiblePerson);
    }

    @GetMapping("/all")
    public List<NoShowLog> getAllLogs() {
        return noShowService.getAllLogs();
    }
}
