package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.entity.CarInventory;
import com.secondhand.funnel.enums.CarStatus;
import com.secondhand.funnel.service.CarInventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cars")
@RequiredArgsConstructor
public class CarInventoryController {

    private final CarInventoryService carInventoryService;

    @PostMapping
    public Result<CarInventory> create(@Valid @RequestBody CarInventory car) {
        return Result.success(carInventoryService.create(car));
    }

    @GetMapping("/{id}")
    public Result<CarInventory> getById(@PathVariable Long id) {
        return Result.success(carInventoryService.getById(id));
    }

    @GetMapping
    public Result<List<CarInventory>> listAll() {
        return Result.success(carInventoryService.listAll());
    }

    @GetMapping("/vin/{carVin}")
    public Result<CarInventory> getByCarVin(@PathVariable String carVin) {
        return Result.success(carInventoryService.getByCarVin(carVin));
    }

    @GetMapping("/status/{status}")
    public Result<List<CarInventory>> getByStatus(@PathVariable CarStatus status) {
        return Result.success(carInventoryService.getByStatus(status));
    }

    @GetMapping("/assessor/{assessorId}")
    public Result<List<CarInventory>> getByAssessorId(@PathVariable Long assessorId) {
        return Result.success(carInventoryService.getByAssessorId(assessorId));
    }

    @GetMapping("/with-anomalies")
    public Result<List<CarInventory>> getCarsWithAnomalies() {
        return Result.success(carInventoryService.getCarsWithAnomalies());
    }

    @PutMapping("/{id}")
    public Result<CarInventory> update(@PathVariable Long id, @Valid @RequestBody CarInventory car) {
        return Result.success(carInventoryService.update(id, car));
    }

    @PatchMapping("/{id}/status")
    public Result<CarInventory> updateStatus(@PathVariable Long id, @RequestParam CarStatus status) {
        return Result.success(carInventoryService.updateStatus(id, status));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        carInventoryService.delete(id);
        return Result.success();
    }
}
