package com.usedcar.scheduling.repository;

import com.usedcar.scheduling.domain.TestDriveRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TestDriveRecordRepository extends JpaRepository<TestDriveRecord, Long> {

    List<TestDriveRecord> findByVehicleId(Long vehicleId);

    Page<TestDriveRecord> findByDriveDateBetween(LocalDate start, LocalDate end, Pageable pageable);

    List<TestDriveRecord> findByDriveDateBetween(LocalDate start, LocalDate end);

    List<TestDriveRecord> findBySalesId(Long salesId);

    long countByVehicleId(Long vehicleId);
}
