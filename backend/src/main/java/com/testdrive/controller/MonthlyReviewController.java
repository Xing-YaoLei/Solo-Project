package com.testdrive.controller;

import com.testdrive.dto.ConversionStatVO;
import com.testdrive.dto.ExportMetaDTO;
import com.testdrive.dto.MonthlyReviewQueryDTO;
import com.testdrive.service.MonthlyReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monthly-review")
@RequiredArgsConstructor
public class MonthlyReviewController {

    private final MonthlyReviewService monthlyReviewService;

    @GetMapping("/conversion-stats")
    public List<ConversionStatVO> getConversionStats(MonthlyReviewQueryDTO query) {
        return monthlyReviewService.getConversionStats(query);
    }

    @GetMapping("/export-meta")
    public ExportMetaDTO getExportMeta(MonthlyReviewQueryDTO query,
                                       @RequestParam String operator) {
        return monthlyReviewService.getExportMeta(query, operator);
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReport(MonthlyReviewQueryDTO query,
                                                @RequestParam String operator) {
        try {
            byte[] data = monthlyReviewService.exportMonthlyReport(query, operator);
            String filename = "线索转化月报_" + query.getYearMonth() + ".xlsx";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(data);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
