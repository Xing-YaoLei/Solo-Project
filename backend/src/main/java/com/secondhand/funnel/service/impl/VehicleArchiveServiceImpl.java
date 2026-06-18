package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.entity.VehicleArchive;
import com.secondhand.funnel.exception.BusinessException;
import com.secondhand.funnel.repository.VehicleArchiveRepository;
import com.secondhand.funnel.service.VehicleArchiveService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleArchiveServiceImpl implements VehicleArchiveService {

    private static final List<String> REQUIRED_FIELDS = List.of(
            "carVin", "plateNumber", "brand", "model", "mileage",
            "registerDate", "ownerInfo", "accidentHistory", "maintenanceRecords"
    );

    private final VehicleArchiveRepository vehicleArchiveRepository;

    @Override
    @Transactional
    public VehicleArchive createOrUpdate(Long carId, VehicleArchive archive) {
        Optional<VehicleArchive> existingOpt = vehicleArchiveRepository.findByCarId(carId);
        if (existingOpt.isPresent()) {
            VehicleArchive existing = existingOpt.get();
            existing.setArchiveData(archive.getArchiveData());
            existing.setIsComplete(checkIsComplete(archive.getArchiveData()));
            VehicleArchive saved = vehicleArchiveRepository.save(existing);
            log.info("更新车辆档案成功: carId={}", carId);
            return saved;
        } else {
            archive.setId(null);
            archive.setCarId(carId);
            archive.setIsComplete(checkIsComplete(archive.getArchiveData()));
            VehicleArchive saved = vehicleArchiveRepository.save(archive);
            log.info("创建车辆档案成功: carId={}", carId);
            return saved;
        }
    }

    @Override
    public VehicleArchive getById(Long id) {
        return vehicleArchiveRepository.findById(id)
                .orElseThrow(() -> new BusinessException("车辆档案不存在: " + id));
    }

    @Override
    public VehicleArchive getByCarId(Long carId) {
        return vehicleArchiveRepository.findByCarId(carId)
                .orElseThrow(() -> new BusinessException("车辆档案不存在, carId=" + carId));
    }

    @Override
    @Transactional
    public VehicleArchive update(Long id, VehicleArchive archive) {
        VehicleArchive existing = getById(id);
        existing.setArchiveData(archive.getArchiveData());
        existing.setIsComplete(checkIsComplete(archive.getArchiveData()));
        VehicleArchive saved = vehicleArchiveRepository.save(existing);
        log.info("更新车辆档案成功: id={}", id);
        return saved;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!vehicleArchiveRepository.existsById(id)) {
            throw new BusinessException("车辆档案不存在: " + id);
        }
        vehicleArchiveRepository.deleteById(id);
        log.info("删除车辆档案成功: id={}", id);
    }

    @Override
    public List<VehicleArchive> listAll() {
        return vehicleArchiveRepository.findAll();
    }

    @Override
    public List<VehicleArchive> getIncompleteArchives() {
        return vehicleArchiveRepository.findByIsComplete(false);
    }

    @Override
    @Transactional
    public VehicleArchive updateArchiveData(Long carId, Map<String, Object> archiveData) {
        Optional<VehicleArchive> existingOpt = vehicleArchiveRepository.findByCarId(carId);
        VehicleArchive archive;
        if (existingOpt.isPresent()) {
            archive = existingOpt.get();
            Map<String, Object> existingData = archive.getArchiveData();
            if (existingData != null) {
                existingData.putAll(archiveData);
                archive.setArchiveData(existingData);
            } else {
                archive.setArchiveData(archiveData);
            }
        } else {
            archive = new VehicleArchive();
            archive.setCarId(carId);
            archive.setArchiveData(archiveData);
        }
        archive.setIsComplete(checkIsComplete(archive.getArchiveData()));
        VehicleArchive saved = vehicleArchiveRepository.save(archive);
        log.info("部分更新车辆档案数据成功: carId={}", carId);
        return saved;
    }

    @Override
    public boolean checkArchiveComplete(Long carId) {
        Optional<VehicleArchive> archiveOpt = vehicleArchiveRepository.findByCarId(carId);
        if (archiveOpt.isEmpty()) {
            return false;
        }
        return Boolean.TRUE.equals(archiveOpt.get().getIsComplete());
    }

    private boolean checkIsComplete(Map<String, Object> archiveData) {
        if (archiveData == null || archiveData.isEmpty()) {
            return false;
        }
        for (String field : REQUIRED_FIELDS) {
            Object value = archiveData.get(field);
            if (value == null || (value instanceof String && ((String) value).trim().isEmpty())) {
                return false;
            }
        }
        return true;
    }
}
