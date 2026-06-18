package com.dealership.scheduler.service;

import com.dealership.scheduler.entity.TestDriveAppointment;
import com.dealership.scheduler.entity.TestDriveFeedback;
import com.dealership.scheduler.entity.TestDriveRecord;
import com.dealership.scheduler.dto.AppointmentQueryDTO;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TestDriveService {
    TestDriveAppointment createAppointment(TestDriveAppointment appointment);
    TestDriveAppointment updateAppointment(TestDriveAppointment appointment);
    Optional<TestDriveAppointment> findAppointmentById(Long id);
    List<TestDriveAppointment> searchAppointments(AppointmentQueryDTO query);
    List<TestDriveAppointment> findAppointmentsByDate(LocalDate date);

    TestDriveRecord createRecord(TestDriveRecord record);
    TestDriveRecord updateRecord(TestDriveRecord record);
    Optional<TestDriveRecord> findRecordByAppointmentId(Long appointmentId);
    List<TestDriveRecord> findRecordsByLeadId(Long leadId);

    TestDriveFeedback createFeedback(TestDriveFeedback feedback);
    Optional<TestDriveFeedback> findFeedbackByAppointmentId(Long appointmentId);
    List<TestDriveFeedback> findFeedbacksByLeadId(Long leadId);

    void cancelAppointment(Long id, String reason);
    void completeAppointment(Long id);
    void markAsNoShow(Long appointmentId);

    boolean isTimeSlotAvailable(LocalDate date, java.time.LocalTime time, String vehicleId, Long excludeAppointmentId);
}
