package com.usedcar.scheduling.service.impl;

import com.usedcar.scheduling.domain.TestDriveRecord;
import com.usedcar.scheduling.dto.TestDriveDTO;
import com.usedcar.scheduling.repository.TestDriveRecordRepository;
import com.usedcar.scheduling.service.TestDriveService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TestDriveServiceImpl implements TestDriveService {

    private final TestDriveRecordRepository testDriveRecordRepository;

    @Override
    public Page<TestDriveRecord> findAll(Pageable pageable) {
        return testDriveRecordRepository.findAll(pageable);
    }

    @Override
    public List<TestDriveRecord> findByVehicleId(Long vehicleId) {
        return testDriveRecordRepository.findByVehicleId(vehicleId);
    }

    @Override
    @Transactional
    public TestDriveRecord create(TestDriveRecord record) {
        return testDriveRecordRepository.save(record);
    }

    @Override
    public Page<TestDriveRecord> findByDateRange(LocalDate start, LocalDate end, Pageable pageable) {
        return testDriveRecordRepository.findByDriveDateBetween(start, end, pageable);
    }

    @Override
    public TestDriveDTO toDTO(TestDriveRecord record) {
        TestDriveDTO dto = new TestDriveDTO();
        dto.setId(record.getId());
        dto.setVehicleId(record.getVehicle().getId());
        dto.setVehicleVin(record.getVehicle().getVin());
        dto.setVehicleInfo(record.getVehicle().getVin() + " - " + record.getVehicle().getBrand() + " " + record.getVehicle().getModel());
        dto.setCustomerName(record.getCustomerName());
        dto.setCustomerPhone(record.getCustomerPhone());
        dto.setDriveDate(record.getDriveDate());
        dto.setMileageBefore(record.getMileageBefore());
        dto.setMileageAfter(record.getMileageAfter());
        dto.setFeedback(record.getFeedback());
        dto.setSalesName(record.getSales() != null ? record.getSales().getRealName() : null);
        return dto;
    }
}
