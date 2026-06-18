package com.dealership.scheduler.repository;

import com.dealership.scheduler.entity.TestDriveRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestDriveRecordRepository extends JpaRepository<TestDriveRecord, Long> {
    Optional<TestDriveRecord> findByAppointmentId(Long appointmentId);
    List<TestDriveRecord> findByLeadId(Long leadId);
    List<TestDriveRecord> findByDriverId(Long driverId);
}
