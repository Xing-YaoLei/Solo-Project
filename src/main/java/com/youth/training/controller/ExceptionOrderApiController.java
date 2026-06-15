package com.youth.training.controller;

import com.youth.training.common.Result;
import com.youth.training.dto.ExceptionOrderDTO;
import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.ExceptionOrder;
import com.youth.training.repository.ExceptionOrderRepository;
import com.youth.training.service.ExceptionOrderService;
import com.youth.training.service.StatusHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/exceptions")
@RequiredArgsConstructor
public class ExceptionOrderApiController {

    private final ExceptionOrderService exceptionOrderService;
    private final ExceptionOrderRepository exceptionOrderRepository;
    private final StatusHistoryService statusHistoryService;

    @GetMapping("/list")
    public Result<List<ExceptionOrder>> list(@RequestParam(required = false) String status) {
        List<ExceptionOrder> list;
        if (status != null && !status.isEmpty()) {
            list = exceptionOrderRepository.findByStatusOrderByCreateTimeDesc(status);
        } else {
            list = exceptionOrderRepository.findAll(Sort.by(Sort.Direction.DESC, "createTime"));
        }
        return Result.success(list);
    }

    @GetMapping("/{id}")
    public Result<ExceptionOrder> detail(@PathVariable Long id) {
        return Result.success(exceptionOrderRepository.findById(id).orElse(null));
    }

    @PostMapping("/")
    public Result<ExceptionOrder> create(@RequestBody ExceptionOrderDTO dto) {
        return Result.success(exceptionOrderService.createExceptionOrder(dto));
    }

    @PutMapping("/{id}/resolve")
    public Result<ExceptionOrder> resolve(@PathVariable Long id,
                                           @RequestParam String handlingResult,
                                           @RequestParam String handledBy,
                                           @RequestParam(required = false) Double completionRateAfter) {
        return Result.success(exceptionOrderService.resolveException(id, handlingResult, handledBy, completionRateAfter));
    }

    @PutMapping("/{id}/close")
    public Result<ExceptionOrder> close(@PathVariable Long id) {
        ExceptionOrder order = exceptionOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("异常单不存在: " + id));
        String oldStatus = order.getStatus();
        order.setStatus("CLOSED");
        ExceptionOrder saved = exceptionOrderRepository.save(order);

        if (!"CLOSED".equals(oldStatus)) {
            StatusChangeDTO statusDTO = new StatusChangeDTO();
            statusDTO.setBusinessId(saved.getId());
            statusDTO.setBusinessType("EXCEPTION_ORDER");
            statusDTO.setOldStatus(oldStatus);
            statusDTO.setNewStatus("CLOSED");
            statusDTO.setChangeReason("关闭异常单");
            statusDTO.setOperator("SYSTEM");
            statusHistoryService.saveStatusHistory(statusDTO);
        }
        return Result.success(saved);
    }

    @GetMapping("/student/{studentId}")
    public Result<List<ExceptionOrder>> studentExceptions(@PathVariable Long studentId) {
        return Result.success(exceptionOrderService.getOrdersByStudent(studentId));
    }
}
