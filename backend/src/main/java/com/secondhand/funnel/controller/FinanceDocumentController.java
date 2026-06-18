package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.dto.DocumentMissingDTO;
import com.secondhand.funnel.entity.FinanceDocument;
import com.secondhand.funnel.enums.DocType;
import com.secondhand.funnel.service.FinanceDocumentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance-documents")
@RequiredArgsConstructor
public class FinanceDocumentController {

    private final FinanceDocumentService financeDocumentService;

    @PostMapping
    public Result<FinanceDocument> create(@Valid @RequestBody FinanceDocument document) {
        return Result.success(financeDocumentService.create(document));
    }

    @GetMapping("/{id}")
    public Result<FinanceDocument> getById(@PathVariable Long id) {
        return Result.success(financeDocumentService.getById(id));
    }

    @GetMapping
    public Result<List<FinanceDocument>> listAll() {
        return Result.success(financeDocumentService.listAll());
    }

    @GetMapping("/car/{carId}")
    public Result<List<FinanceDocument>> getByCarId(@PathVariable Long carId) {
        return Result.success(financeDocumentService.getByCarId(carId));
    }

    @GetMapping("/car/{carId}/missing")
    public Result<List<FinanceDocument>> getMissingByCarId(@PathVariable Long carId) {
        return Result.success(financeDocumentService.getMissingByCarId(carId));
    }

    @GetMapping("/car/{carId}/missing-count")
    public Result<Long> countMissingByCarId(@PathVariable Long carId) {
        return Result.success(financeDocumentService.countMissingByCarId(carId));
    }

    @GetMapping("/car/{carId}/doc-type/{docType}")
    public Result<FinanceDocument> getByCarIdAndDocType(@PathVariable Long carId, @PathVariable DocType docType) {
        return Result.success(financeDocumentService.getByCarIdAndDocType(carId, docType));
    }

    @GetMapping("/missing-cars")
    public Result<List<DocumentMissingDTO>> getCarsWithMissingDocs() {
        return Result.success(financeDocumentService.getCarsWithMissingDocs());
    }

    @GetMapping("/car/{carId}/check-complete")
    public Result<Boolean> checkAllDocumentsComplete(@PathVariable Long carId) {
        return Result.success(financeDocumentService.checkAllDocumentsComplete(carId));
    }

    @PutMapping("/{id}")
    public Result<FinanceDocument> update(@PathVariable Long id, @Valid @RequestBody FinanceDocument document) {
        return Result.success(financeDocumentService.update(id, document));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        financeDocumentService.delete(id);
        return Result.success();
    }
}
