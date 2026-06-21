package com.usedcar.acquisition.controller;

import com.usedcar.acquisition.common.Result;
import com.usedcar.acquisition.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/turnover-stats")
    public Result<Map<String, Object>> getTurnoverStats() {
        return Result.success(inventoryService.getTurnoverStats());
    }

    @GetMapping("/list")
    public Result<List<Map<String, Object>>> getInventoryList(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return Result.success(inventoryService.getInventoryList(startDate, endDate));
    }
}
