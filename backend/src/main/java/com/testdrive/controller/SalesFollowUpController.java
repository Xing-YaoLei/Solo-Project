package com.testdrive.controller;

import com.testdrive.entity.SalesFollowUp;
import com.testdrive.repository.SalesFollowUpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales-follow-ups")
@RequiredArgsConstructor
public class SalesFollowUpController {

    private final SalesFollowUpRepository salesFollowUpRepository;

    @GetMapping
    public List<SalesFollowUp> list(@RequestParam(required = false) Long vehicleId,
                                     @RequestParam(required = false) Long appointmentId) {
        if (vehicleId != null) return salesFollowUpRepository.findByVehicleId(vehicleId);
        if (appointmentId != null) return salesFollowUpRepository.findByAppointmentId(appointmentId);
        return salesFollowUpRepository.findAll();
    }

    @PostMapping
    public SalesFollowUp create(@RequestBody SalesFollowUp followUp) {
        return salesFollowUpRepository.save(followUp);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SalesFollowUp> update(@PathVariable Long id, @RequestBody SalesFollowUp followUp) {
        return salesFollowUpRepository.findById(id)
                .map(existing -> {
                    followUp.setId(id);
                    return ResponseEntity.ok(salesFollowUpRepository.save(followUp));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
