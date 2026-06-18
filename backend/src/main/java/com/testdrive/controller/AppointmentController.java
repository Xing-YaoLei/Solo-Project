package com.testdrive.controller;

import com.testdrive.dto.AppointmentDispatchVO;
import com.testdrive.entity.Appointment;
import com.testdrive.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @GetMapping("/dispatch")
    public List<AppointmentDispatchVO> getDispatchBoard(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return appointmentService.getDispatchBoard(date);
    }

    @PostMapping
    public Appointment create(@RequestBody Appointment appointment) {
        return appointmentService.createAppointment(appointment);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Appointment> updateStatus(@PathVariable Long id,
                                                     @RequestParam String status,
                                                     @RequestParam String operator) {
        return ResponseEntity.ok(appointmentService.updateAppointmentStatus(id, status, operator));
    }
}
