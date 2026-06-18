package com.secondhand.funnel.service;

import com.secondhand.funnel.entity.InventoryTurnover;

import java.util.List;
import java.util.Optional;

public interface InventoryTurnoverService {
    InventoryTurnover create(InventoryTurnover turnover);
    InventoryTurnover getById(Long id);
    List<InventoryTurnover> getByCarId(Long carId);
    Optional<InventoryTurnover> getLatestByCarId(Long carId);
    List<InventoryTurnover> listAll();
    InventoryTurnover calculateAndCreate(Long carId);
    Double getAvgDaysByStage(String stage);
    Double getOverallAvgDays();
    void delete(Long id);
}
