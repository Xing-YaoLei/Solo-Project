package com.dealership.scheduler.repository;

import com.dealership.scheduler.entity.TestDriveRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestDriveRecordRepository extends JpaRepository<TestDriveRecord, Long> {

    @Query("SELECT r FROM TestDriveRecord r LEFT JOIN FETCH r.driver LEFT JOIN FETCH r.lead WHERE r.appointment.id = :appointmentId")
    Optional<TestDriveRecord> findByAppointmentIdWithDetails(@Param("appointmentId") Long appointmentId);

    @Query("SELECT r FROM TestDriveRecord r LEFT JOIN FETCH r.driver LEFT JOIN FETCH r.appointment WHERE r.lead.id = :leadId")
    List<TestDriveRecord> findByLeadIdWithDetails(@Param("leadId") Long leadId);

    Optional<TestDriveRecord> findByAppointmentId(Long appointmentId);
    List<TestDriveRecord> findByLeadId(Long leadId);
    List<TestDriveRecord> findByDriverId(Long driverId);
}
