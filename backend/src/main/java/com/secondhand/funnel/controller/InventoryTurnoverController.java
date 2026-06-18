package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.entity.InventoryTurnover;
import com.secondhand.funnel.service.InventoryTurnoverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/inventory-turnover")
@RequiredArgsConstructor
public class InventoryTurnoverController {

    private final InventoryTurnoverService inventoryTurnoverService;

    @PostMapping
    public Result<InventoryTurnover> create(@Valid @RequestBody InventoryTurnover turnover) {
        return Result.success(inventoryTurnoverService.create(turnover));
    }

    @GetMapping("/{id}")
    public Result<InventoryTurnover> getById(@PathVariable Long id) {
        return Result.success(inventoryTurnoverService.getById(id));
    }

    @GetMapping
    public Result<List<InventoryTurnover>> listAll() {
        return Result.success(inventoryTurnoverService.listAll());
    }

    @GetMapping("/car/{carId}")
    public Result<List<InventoryTurnover>> getByCarId(@PathVariable Long carId) {
        return Result.success(inventoryTurnoverService.getByCarId(carId));
    }

    @GetMapping("/car/{carId}/latest")
    public Result<Optional<InventoryTurnover>> getLatestByCarId(@PathVariable Long carId) {
        return Result.success(inventoryTurnoverService.getLatestByCarId(carId));
    }

    @PostMapping("/calculate/{carId}")
    public Result<InventoryTurnover> calculateAndCreate(@PathVariable Long carId) {
        return Result.success(inventoryTurnoverService.calculateAndCreate(carId));
    }

    @GetMapping("/avg-days/stage/{stage}")
    public Result<Double> getAvgDaysByStage(@PathVariable String stage) {
        return Result.success(inventoryTurnoverService.getAvgDaysByStage(stage));
    }

    @GetMapping("/avg-days/overall")
    public Result<Double> getOverallAvgDays() {
        return Result.success(inventoryTurnoverService.getOverallAvgDays());
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        inventoryTurnoverService.delete(id);
        return Result.success();
    }
}
