package com.secondhand.funnel.service;

import com.secondhand.funnel.entity.CarInventory;
import com.secondhand.funnel.enums.CarStatus;

import java.util.List;

public interface CarInventoryService {
    CarInventory create(CarInventory car);
    CarInventory getById(Long id);
    CarInventory getByCarVin(String carVin);
    List<CarInventory> listAll();
    List<CarInventory> getByStatus(CarStatus status);
    List<CarInventory> getByAssessorId(Long assessorId);
    List<CarInventory> getCarsWithAnomalies();
    CarInventory update(Long id, CarInventory car);
    void delete(Long id);
    CarInventory updateStatus(Long id, CarStatus status);
}
