package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.entity.DataAnomaly;
import com.secondhand.funnel.enums.AnomalyType;
import com.secondhand.funnel.service.DataAnomalyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/data-anomalies")
@RequiredArgsConstructor
public class DataAnomalyController {

    private final DataAnomalyService dataAnomalyService;

    @PostMapping
    public Result<DataAnomaly> create(@Valid @RequestBody DataAnomaly anomaly) {
        return Result.success(dataAnomalyService.create(anomaly));
    }

    @GetMapping("/{id}")
    public Result<DataAnomaly> getById(@PathVariable Long id) {
        return Result.success(dataAnomalyService.getById(id));
    }

    @GetMapping
    public Result<List<DataAnomaly>> listAll() {
        return Result.success(dataAnomalyService.listAll());
    }

    @GetMapping("/car/{carId}")
    public Result<List<DataAnomaly>> getByCarId(@PathVariable Long carId) {
        return Result.success(dataAnomalyService.getByCarId(carId));
    }

    @GetMapping("/type/{type}")
    public Result<List<DataAnomaly>> getByAnomalyType(@PathVariable AnomalyType type) {
        return Result.success(dataAnomalyService.getByAnomalyType(type));
    }

    @GetMapping("/unresolved")
    public Result<List<DataAnomaly>> getUnresolved() {
        return Result.success(dataAnomalyService.getUnresolved());
    }

    @GetMapping("/unresolved/count")
    public Result<Long> countUnresolved() {
        return Result.success(dataAnomalyService.countUnresolved());
    }

    @PatchMapping("/{id}/resolve")
    public Result<DataAnomaly> resolve(
            @PathVariable Long id,
            @RequestParam(required = false) String description) {
        return Result.success(dataAnomalyService.resolve(id, description));
    }

    @PutMapping("/{id}")
    public Result<DataAnomaly> update(@PathVariable Long id, @Valid @RequestBody DataAnomaly anomaly) {
        return Result.success(dataAnomalyService.update(id, anomaly));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        dataAnomalyService.delete(id);
        return Result.success();
    }
}
