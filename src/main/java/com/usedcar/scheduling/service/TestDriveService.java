package com.usedcar.scheduling.service;

import com.usedcar.scheduling.domain.TestDriveRecord;
import com.usedcar.scheduling.dto.TestDriveDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

public interface TestDriveService {

    Page<TestDriveRecord> findAll(Pageable pageable);

    List<TestDriveRecord> findByVehicleId(Long vehicleId);

    TestDriveRecord create(TestDriveRecord record);

    Page<TestDriveRecord> findByDateRange(LocalDate start, LocalDate end, Pageable pageable);

    TestDriveDTO toDTO(TestDriveRecord record);
}
