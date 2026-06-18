package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.entity.QuotationHistory;
import com.secondhand.funnel.service.QuotationHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quotations")
@RequiredArgsConstructor
public class QuotationHistoryController {

    private final QuotationHistoryService quotationHistoryService;

    @PostMapping
    public Result<QuotationHistory> create(@Valid @RequestBody QuotationHistory quotation) {
        return Result.success(quotationHistoryService.create(quotation));
    }

    @GetMapping("/{id}")
    public Result<QuotationHistory> getById(@PathVariable Long id) {
        return Result.success(quotationHistoryService.getById(id));
    }

    @GetMapping
    public Result<List<QuotationHistory>> listAll() {
        return Result.success(quotationHistoryService.listAll());
    }

    @GetMapping("/car/{carId}")
    public Result<List<QuotationHistory>> getByCarId(@PathVariable Long carId) {
        return Result.success(quotationHistoryService.getByCarId(carId));
    }

    @GetMapping("/quoted-by/{userId}")
    public Result<List<QuotationHistory>> getByQuotedBy(@PathVariable Long userId) {
        return Result.success(quotationHistoryService.getByQuotedBy(userId));
    }

    @PutMapping("/{id}")
    public Result<QuotationHistory> update(@PathVariable Long id, @Valid @RequestBody QuotationHistory quotation) {
        return Result.success(quotationHistoryService.update(id, quotation));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        quotationHistoryService.delete(id);
        return Result.success();
    }
}
