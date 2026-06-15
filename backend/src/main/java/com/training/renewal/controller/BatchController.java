package com.training.renewal.controller;

import com.training.renewal.common.Result;
import com.training.renewal.entity.ImportBatch;
import com.training.renewal.service.BatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/batches")
@RequiredArgsConstructor
public class BatchController {

    private final BatchService batchService;

    @GetMapping("/{batchId}")
    public Result<ImportBatch> getBatch(@PathVariable String batchId) {
        ImportBatch batch = batchService.getBatch(batchId);
        if (batch == null) {
            return Result.error("批次不存在");
        }
        return Result.success(batch);
    }

    @GetMapping("/recent")
    public Result<List<ImportBatch>> getRecentBatches(
            @RequestParam(defaultValue = "10") int limit) {
        return Result.success(batchService.getRecentBatches(limit));
    }

    @GetMapping("/type/{batchType}")
    public Result<List<ImportBatch>> getBatchesByType(@PathVariable String batchType) {
        return Result.success(batchService.getBatchesByType(batchType));
    }

    @GetMapping("/delayed")
    public Result<List<ImportBatch>> getDelayedBatches() {
        return Result.success(batchService.getDelayedBatches());
    }

    @GetMapping("/time-range")
    public Result<List<ImportBatch>> getBatchesByTimeRange(
            @RequestParam String batchType,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        return Result.success(batchService.getBatchesByTimeRange(batchType, startTime, endTime));
    }

    @PostMapping("/create")
    public Result<ImportBatch> createBatch(
            @RequestParam String batchType,
            @RequestParam String batchName,
            @RequestParam(required = false) String operatorId,
            @RequestParam(required = false) String operatorName,
            @RequestParam(required = false) String remark) {
        return Result.success(batchService.createBatch(
                batchType, batchName, operatorId, operatorName, remark));
    }

    @PostMapping("/{batchId}/complete")
    public Result<ImportBatch> completeBatch(
            @PathVariable String batchId,
            @RequestParam int totalCount,
            @RequestParam int successCount,
            @RequestParam int failCount) {
        return Result.success(batchService.completeBatch(batchId, totalCount, successCount, failCount));
    }

    @PostMapping("/{batchId}/fail")
    public Result<ImportBatch> failBatch(
            @PathVariable String batchId,
            @RequestParam String failReason) {
        return Result.success(batchService.failBatch(batchId, failReason));
    }
}
