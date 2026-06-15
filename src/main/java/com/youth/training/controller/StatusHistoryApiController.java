package com.youth.training.controller;

import com.youth.training.common.Result;
import com.youth.training.entity.StatusHistory;
import com.youth.training.repository.StatusHistoryRepository;
import com.youth.training.service.StatusHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class StatusHistoryApiController {

    private final StatusHistoryService statusHistoryService;
    private final StatusHistoryRepository statusHistoryRepository;

    @GetMapping("/list")
    public Result<List<StatusHistory>> listByBusiness(@RequestParam(required = false) Long businessId,
                                                       @RequestParam(required = false) String businessType) {
        List<StatusHistory> list;
        if (businessId != null && businessType != null) {
            list = statusHistoryService.getHistoryByBusiness(businessId, businessType);
        } else if (businessType != null) {
            list = statusHistoryRepository.findByBusinessTypeOrderByCreateTimeDesc(businessType);
        } else {
            list = statusHistoryRepository.findAll();
        }
        return Result.success(list);
    }

    @GetMapping("/operator")
    public Result<List<StatusHistory>> listByOperator(@RequestParam String operator) {
        return Result.success(statusHistoryRepository.findByOperatorOrderByCreateTimeDesc(operator));
    }
}
