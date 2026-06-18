package com.secondhand.funnel.controller;

import com.secondhand.funnel.service.ExcelExportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExcelExportController {

    private final ExcelExportService excelExportService;

    @GetMapping("/funnel-stats")
    public void exportFunnelStats(HttpServletResponse response) throws IOException {
        excelExportService.exportFunnelStats(response);
    }

    @GetMapping("/car-inventory")
    public void exportCarInventory(HttpServletResponse response) throws IOException {
        excelExportService.exportCarInventory(response);
    }

    @GetMapping("/inventory-turnover")
    public void exportInventoryTurnover(HttpServletResponse response) throws IOException {
        excelExportService.exportInventoryTurnover(response);
    }
}
