package com.dealership.scheduler.service;

import com.dealership.scheduler.entity.NoShowRecord;

import java.util.List;
import java.util.Optional;

public interface NoShowService {
    NoShowRecord createNoShow(Long appointmentId);
    NoShowRecord handleNoShow(Long id, Long handlerId, String actionTaken);
    NoShowRecord updateReason(Long id, String reason);
    NoShowRecord close(Long id, Long handlerId, String actionTaken);
    NoShowRecord reschedule(Long id, Long handlerId, Long newAppointmentId);
    Optional<NoShowRecord> findById(Long id);
    Optional<NoShowRecord> findByIdWithDetails(Long id);
    Optional<NoShowRecord> findByAppointmentId(Long appointmentId);
    List<NoShowRecord> findPending();
    List<NoShowRecord> findPendingWithDetails();
    List<NoShowRecord> findAll();
    List<NoShowRecord> findAllWithDetails();
    void detectAndMarkNoShows();
}
