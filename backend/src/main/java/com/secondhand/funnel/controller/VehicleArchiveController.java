package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.entity.VehicleArchive;
import com.secondhand.funnel.service.VehicleArchiveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicle-archives")
@RequiredArgsConstructor
public class VehicleArchiveController {

    private final VehicleArchiveService vehicleArchiveService;

    @PostMapping("/car/{carId}")
    public Result<VehicleArchive> createOrUpdate(@PathVariable Long carId, @Valid @RequestBody VehicleArchive archive) {
        return Result.success(vehicleArchiveService.createOrUpdate(carId, archive));
    }

    @GetMapping("/{id}")
    public Result<VehicleArchive> getById(@PathVariable Long id) {
        return Result.success(vehicleArchiveService.getById(id));
    }

    @GetMapping
    public Result<List<VehicleArchive>> listAll() {
        return Result.success(vehicleArchiveService.listAll());
    }

    @GetMapping("/car/{carId}")
    public Result<VehicleArchive> getByCarId(@PathVariable Long carId) {
        return Result.success(vehicleArchiveService.getByCarId(carId));
    }

    @GetMapping("/incomplete")
    public Result<List<VehicleArchive>> getIncompleteArchives() {
        return Result.success(vehicleArchiveService.getIncompleteArchives());
    }

    @GetMapping("/car/{carId}/check-complete")
    public Result<Boolean> checkArchiveComplete(@PathVariable Long carId) {
        return Result.success(vehicleArchiveService.checkArchiveComplete(carId));
    }

    @PatchMapping("/car/{carId}/data")
    public Result<VehicleArchive> updateArchiveData(@PathVariable Long carId, @RequestBody Map<String, Object> archiveData) {
        return Result.success(vehicleArchiveService.updateArchiveData(carId, archiveData));
    }

    @PutMapping("/{id}")
    public Result<VehicleArchive> update(@PathVariable Long id, @Valid @RequestBody VehicleArchive archive) {
        return Result.success(vehicleArchiveService.update(id, archive));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        vehicleArchiveService.delete(id);
        return Result.success();
    }
}
