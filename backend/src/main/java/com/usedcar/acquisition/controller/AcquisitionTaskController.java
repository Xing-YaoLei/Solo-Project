package com.usedcar.acquisition.controller;

import com.usedcar.acquisition.common.PageResult;
import com.usedcar.acquisition.common.Result;
import com.usedcar.acquisition.dto.*;
import com.usedcar.acquisition.service.AcquisitionTaskService;
import com.usedcar.acquisition.vo.TaskDetailVO;
import com.usedcar.acquisition.vo.TaskListVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/task")
@RequiredArgsConstructor
public class AcquisitionTaskController {

    private final AcquisitionTaskService taskService;

    @PostMapping("/create")
    public Result<Long> createTask(@Valid @RequestBody TaskCreateDTO dto) {
        return Result.success(taskService.createTask(dto));
    }

    @PostMapping("/page")
    public Result<PageResult<TaskListVO>> queryPage(@RequestBody TaskQueryDTO dto) {
        return Result.success(taskService.queryTaskPage(dto));
    }

    @GetMapping("/detail/{id}")
    public Result<TaskDetailVO> getDetail(@PathVariable Long id) {
        return Result.success(taskService.getTaskDetail(id));
    }

    @PostMapping("/start-assess")
    public Result<Void> startAssess(@RequestParam Long taskId,
                                    @RequestParam Long operatorId,
                                    @RequestParam(required = false) String remark) {
        taskService.startAssess(taskId, operatorId, remark);
        return Result.success();
    }

    @PostMapping("/add-quote")
    public Result<Void> addQuote(@Valid @RequestBody QuoteAddDTO dto) {
        taskService.addQuote(dto);
        return Result.success();
    }

    @PostMapping("/flag-missing")
    public Result<Void> flagMissing(@Valid @RequestBody MissingMaterialDTO dto) {
        taskService.flagMissingMaterial(dto);
        return Result.success();
    }

    @PostMapping("/submit-supplement")
    public Result<Void> submitSupplement(@RequestParam Long taskId,
                                         @RequestParam Long operatorId,
                                         @RequestParam(required = false) String remark) {
        taskService.submitSupplement(taskId, operatorId, remark);
        return Result.success();
    }

    @PostMapping("/escalate")
    public Result<Void> escalate(@Valid @RequestBody EscalateDTO dto) {
        taskService.escalate(dto);
        return Result.success();
    }

    @PostMapping("/confirm-deal")
    public Result<Void> confirmDeal(@RequestParam Long taskId,
                                    @RequestParam BigDecimal finalPrice,
                                    @RequestParam Long operatorId,
                                    @RequestParam(required = false) String remark) {
        taskService.confirmDeal(taskId, finalPrice, operatorId, remark);
        return Result.success();
    }

    @PostMapping("/close")
    public Result<Void> closeTask(@Valid @RequestBody CloseTaskDTO dto) {
        taskService.closeTask(dto);
        return Result.success();
    }

    @PostMapping("/cancel")
    public Result<Void> cancelTask(@RequestParam Long taskId,
                                   @RequestParam Long operatorId,
                                   @RequestParam(required = false) String reason) {
        taskService.cancelTask(taskId, operatorId, reason);
        return Result.success();
    }

    @PostMapping("/upload-material")
    public Result<Void> uploadMaterial(@Valid @RequestBody MaterialUploadDTO dto) {
        taskService.uploadMaterial(dto);
        return Result.success();
    }

    @PostMapping("/verify-material")
    public Result<Void> verifyMaterial(@RequestParam Long materialId,
                                       @RequestParam Long operatorId) {
        taskService.verifyMaterial(materialId, operatorId);
        return Result.success();
    }

    @GetMapping("/statistics")
    public Result<Map<String, Object>> getStatistics(
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        return Result.success(taskService.getStatistics(startTime, endTime));
    }

    @GetMapping("/stats/source")
    public Result<List<Map<String, Object>>> getSourceStats(
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        return Result.success(taskService.getSourceStats(startTime, endTime));
    }

    @GetMapping("/stats/sales")
    public Result<List<Map<String, Object>>> getSalesStats(
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        return Result.success(taskService.getSalesStats(startTime, endTime));
    }

    @GetMapping("/stats/close-type")
    public Result<List<Map<String, Object>>> getCloseTypeStats(
            @RequestParam(required = false) String startTime,
            @RequestParam(required = false) String endTime) {
        return Result.success(taskService.getCloseTypeStats(startTime, endTime));
    }
}
