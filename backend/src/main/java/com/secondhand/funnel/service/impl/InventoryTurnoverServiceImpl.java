package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.entity.CarInventory;
import com.secondhand.funnel.entity.InventoryTurnover;
import com.secondhand.funnel.exception.BusinessException;
import com.secondhand.funnel.repository.CarInventoryRepository;
import com.secondhand.funnel.repository.InventoryTurnoverRepository;
import com.secondhand.funnel.service.InventoryTurnoverService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryTurnoverServiceImpl implements InventoryTurnoverService {

    private final InventoryTurnoverRepository inventoryTurnoverRepository;
    private final CarInventoryRepository carInventoryRepository;

    @Override
    @Transactional
    public InventoryTurnover create(InventoryTurnover turnover) {
        if (turnover.getId() != null) {
            turnover.setId(null);
        }
        if (turnover.getTurnoverStage() == null || turnover.getTurnoverStage().trim().isEmpty()) {
            turnover.setTurnoverStage(getTurnoverStage(turnover.getDaysInInventory()));
        }
        InventoryTurnover saved = inventoryTurnoverRepository.save(turnover);
        log.info("创建库存周转记录成功: id={}, carId={}, days={}",
                saved.getId(), saved.getCarId(), saved.getDaysInInventory());
        return saved;
    }

    @Override
    public InventoryTurnover getById(Long id) {
        return inventoryTurnoverRepository.findById(id)
                .orElseThrow(() -> new BusinessException("库存周转记录不存在: " + id));
    }

    @Override
    public List<InventoryTurnover> getByCarId(Long carId) {
        return inventoryTurnoverRepository.findByCarIdOrderByCalculatedAtDesc(carId);
    }

    @Override
    public Optional<InventoryTurnover> getLatestByCarId(Long carId) {
        return inventoryTurnoverRepository.findTopByCarIdOrderByCalculatedAtDesc(carId);
    }

    @Override
    public List<InventoryTurnover> listAll() {
        return inventoryTurnoverRepository.findAll();
    }

    @Override
    @Transactional
    public InventoryTurnover calculateAndCreate(Long carId) {
        CarInventory car = carInventoryRepository.findById(carId)
                .orElseThrow(() -> new BusinessException("车源不存在: " + carId));

        LocalDateTime startDate = car.getCreatedAt();
        LocalDateTime endDate = LocalDateTime.now();
        long days = Duration.between(startDate, endDate).toDays();
        int daysInInventory = Math.max(1, (int) days);

        InventoryTurnover turnover = new InventoryTurnover();
        turnover.setCarId(carId);
        turnover.setDaysInInventory(daysInInventory);
        turnover.setTurnoverStage(getTurnoverStage(daysInInventory));

        InventoryTurnover saved = inventoryTurnoverRepository.save(turnover);
        log.info("计算并创建库存周转记录成功: carId={}, days={}", carId, daysInInventory);
        return saved;
    }

    @Override
    public Double getAvgDaysByStage(String stage) {
        return inventoryTurnoverRepository.findAvgDaysByStage(stage);
    }

    @Override
    public Double getOverallAvgDays() {
        return inventoryTurnoverRepository.findOverallAvgDays();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!inventoryTurnoverRepository.existsById(id)) {
            throw new BusinessException("库存周转记录不存在: " + id);
        }
        inventoryTurnoverRepository.deleteById(id);
        log.info("删除库存周转记录成功: id={}", id);
    }

    private String getTurnoverStage(Integer days) {
        if (days == null) return "未知";
        if (days <= 7) return "快速周转";
        if (days <= 30) return "正常周转";
        if (days <= 60) return "滞销售后";
        return "长期库存";
    }
}
