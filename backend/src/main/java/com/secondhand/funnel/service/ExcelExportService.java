package com.secondhand.funnel.service;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public interface ExcelExportService {
    void exportFunnelStats(HttpServletResponse response) throws IOException;
    void exportCarInventory(HttpServletResponse response) throws IOException;
    void exportInventoryTurnover(HttpServletResponse response) throws IOException;
}
