package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.entity.CarInventory;
import com.secondhand.funnel.entity.ListingFunnel;
import com.secondhand.funnel.enums.CarStatus;
import com.secondhand.funnel.enums.FunnelStage;
import com.secondhand.funnel.exception.BusinessException;
import com.secondhand.funnel.repository.CarInventoryRepository;
import com.secondhand.funnel.repository.ListingFunnelRepository;
import com.secondhand.funnel.service.CarInventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CarInventoryServiceImpl implements CarInventoryService {

    private final CarInventoryRepository carInventoryRepository;
    private final ListingFunnelRepository listingFunnelRepository;

    @Override
    @Transactional
    public CarInventory create(CarInventory car) {
        if (car.getId() != null) {
            car.setId(null);
        }
        if (carInventoryRepository.findByCarVin(car.getCarVin()) != null) {
            throw new BusinessException("车架号VIN已存在: " + car.getCarVin());
        }
        if (car.getStatus() == null) {
            car.setStatus(CarStatus.PENDING_LISTING);
        }
        if (car.getSourceLibraryDelay() == null) {
            car.setSourceLibraryDelay(false);
        }
        if (car.getDetectorMissing() == null) {
            car.setDetectorMissing(false);
        }
        CarInventory saved = carInventoryRepository.save(car);
        initFunnelStages(saved.getId());
        log.info("创建车源成功: id={}, vin={}", saved.getId(), saved.getCarVin());
        return saved;
    }

    private void initFunnelStages(Long carId) {
        FunnelStage[] stages = FunnelStage.values();
        for (FunnelStage stage : stages) {
            ListingFunnel funnel = new ListingFunnel();
            funnel.setCarId(carId);
            funnel.setStage(stage);
            funnel.setIsCompleted(false);
            listingFunnelRepository.save(funnel);
        }
    }

    @Override
    public CarInventory getById(Long id) {
        return carInventoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("车源不存在: " + id));
    }

    @Override
    public CarInventory getByCarVin(String carVin) {
        CarInventory car = carInventoryRepository.findByCarVin(carVin);
        if (car == null) {
            throw new BusinessException("车源不存在, VIN=" + carVin);
        }
        return car;
    }

    @Override
    public List<CarInventory> listAll() {
        return carInventoryRepository.findAll();
    }

    @Override
    public List<CarInventory> getByStatus(CarStatus status) {
        return carInventoryRepository.findByStatus(status);
    }

    @Override
    public List<CarInventory> getByAssessorId(Long assessorId) {
        return carInventoryRepository.findByAssessorId(assessorId);
    }

    @Override
    public List<CarInventory> getCarsWithAnomalies() {
        return carInventoryRepository.findCarsWithAnomalies();
    }

    @Override
    @Transactional
    public CarInventory update(Long id, CarInventory car) {
        CarInventory existing = getById(id);
        existing.setCarVin(car.getCarVin());
        existing.setPlateNumber(car.getPlateNumber());
        existing.setBrand(car.getBrand());
        existing.setModel(car.getModel());
        existing.setMileage(car.getMileage());
        existing.setRegisterDate(car.getRegisterDate());
        existing.setAssessorId(car.getAssessorId());
        existing.setStatus(car.getStatus());
        existing.setSourceLibraryDelay(car.getSourceLibraryDelay());
        existing.setDetectorMissing(car.getDetectorMissing());
        CarInventory updated = carInventoryRepository.save(existing);
        log.info("更新车源成功: id={}", id);
        return updated;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!carInventoryRepository.existsById(id)) {
            throw new BusinessException("车源不存在: " + id);
        }
        listingFunnelRepository.deleteByCarId(id);
        carInventoryRepository.deleteById(id);
        log.info("删除车源成功: id={}", id);
    }

    @Override
    @Transactional
    public CarInventory updateStatus(Long id, CarStatus status) {
        CarInventory car = getById(id);
        car.setStatus(status);
        if (status == CarStatus.LISTED) {
            ListingFunnel funnel = listingFunnelRepository
                    .findByCarIdAndStage(id, FunnelStage.LISTING_SUCCESS).orElse(null);
            if (funnel != null) {
                funnel.setIsCompleted(true);
                funnel.setCompletedAt(LocalDateTime.now());
                listingFunnelRepository.save(funnel);
            }
        }
        CarInventory saved = carInventoryRepository.save(car);
        log.info("更新车源状态成功: id={}, status={}", id, status);
        return saved;
    }
}
