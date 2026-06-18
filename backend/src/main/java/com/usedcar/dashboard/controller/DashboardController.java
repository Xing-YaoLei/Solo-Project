package com.usedcar.dashboard.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.usedcar.dashboard.dto.*;
import com.usedcar.dashboard.export.ExcelExportService;
import com.usedcar.dashboard.export.PdfExportService;
import com.usedcar.dashboard.service.DashboardService;
import com.usedcar.dashboard.service.FilterViewService;
import com.usedcar.dashboard.service.ShareLinkService;
import com.usedcar.dashboard.util.ViewIdResolver;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final FilterViewService filterViewService;
    private final ShareLinkService shareLinkService;
    private final PdfExportService pdfExportService;
    private final ExcelExportService excelExportService;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    @GetMapping("/overview")
    public ApiResponse<DashboardOverview> getOverview(
            @ModelAttribute DashboardFilter filter,
            @RequestHeader(value = "X-Share-Token", required = false) String shareToken) {
        filter = ViewIdResolver.resolve(filterViewService, filter);
        return ApiResponse.success(dashboardService.getOverview(filter, shareToken));
    }

    @GetMapping("/vehicle-trend")
    public ApiResponse<List<VehicleArchiveTrend>> getVehicleTrend(
            @ModelAttribute DashboardFilter filter,
            @RequestParam(required = false) String viewId,
            @RequestHeader(value = "X-Share-Token", required = false) String shareToken) {
        if (viewId != null && !viewId.isBlank()) {
            filter.setViewId(viewId);
        }
        filter = ViewIdResolver.resolve(filterViewService, filter);
        return ApiResponse.success(dashboardService.getVehicleTrend(filter, shareToken));
    }

    @GetMapping("/inspection-report")
    public ApiResponse<InspectionReportComposition> getInspectionReport(
            @ModelAttribute DashboardFilter filter,
            @RequestParam(required = false) String viewId,
            @RequestHeader(value = "X-Share-Token", required = false) String shareToken) {
        if (viewId != null && !viewId.isBlank()) {
            filter.setViewId(viewId);
        }
        filter = ViewIdResolver.resolve(filterViewService, filter);
        return ApiResponse.success(dashboardService.getInspectionReport(filter, shareToken));
    }

    @GetMapping("/prep-list")
    public ApiResponse<PrepListDetail> getPrepList(
            @ModelAttribute DashboardFilter filter,
            @RequestParam(required = false) String viewId,
            @RequestHeader(value = "X-Share-Token", required = false) String shareToken) {
        if (viewId != null && !viewId.isBlank()) {
            filter.setViewId(viewId);
        }
        filter = ViewIdResolver.resolve(filterViewService, filter);
        return ApiResponse.success(dashboardService.getPrepList(filter, shareToken));
    }

    @GetMapping("/test-drive-anomaly")
    public ApiResponse<TestDriveAnomaly> getTestDriveAnomaly(
            @ModelAttribute DashboardFilter filter,
            @RequestParam(required = false) String viewId,
            @RequestHeader(value = "X-Share-Token", required = false) String shareToken) {
        if (viewId != null && !viewId.isBlank()) {
            filter.setViewId(viewId);
        }
        filter = ViewIdResolver.resolve(filterViewService, filter);
        return ApiResponse.success(dashboardService.getTestDriveAnomaly(filter, shareToken));
    }

    @GetMapping("/filter-views")
    public ApiResponse<List<FilterView>> getFilterViews() {
        return ApiResponse.success(filterViewService.getAllViews());
    }

    @PostMapping("/filter-views")
    public ApiResponse<FilterView> createFilterView(@RequestBody FilterView view) {
        return ApiResponse.success(filterViewService.createView(view));
    }

    @DeleteMapping("/filter-views/{id}")
    public ApiResponse<Void> deleteFilterView(@PathVariable Long id) {
        filterViewService.deleteView(id);
        return ApiResponse.success();
    }

    @PostMapping("/share-links")
    public ApiResponse<ShareLink> createShareLink(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> permissions = (List<String>) body.get("permissions");
        Boolean includesTurnoverMetrics = body.get("includesTurnoverMetrics") != null
                ? (Boolean) body.get("includesTurnoverMetrics") : false;
        Map<String, Object> filtersMap = body.get("filters") != null
                ? (Map<String, Object>) body.get("filters") : null;
        String viewId = body.get("viewId") != null ? (String) body.get("viewId") : null;

        DashboardFilter filters = null;
        if (viewId != null && !viewId.isBlank()) {
            FilterView savedView = filterViewService.getByViewId(viewId);
            if (savedView != null && savedView.getFilters() != null) {
                filters = savedView.getFilters();
                filters.setViewId(viewId);
            }
        }
        if (filters == null && filtersMap != null) {
            filters = objectMapper.convertValue(filtersMap, new TypeReference<>() {});
        }

        return ApiResponse.success(shareLinkService.createShareLink(
                permissions, includesTurnoverMetrics, filters, viewId));
    }

    @GetMapping("/share-links/{token}")
    public ApiResponse<ShareLinkValidation> validateShareLink(@PathVariable String token) {
        return ApiResponse.success(shareLinkService.validateShareLink(token));
    }

    @GetMapping("/export/pdf")
    public void exportPdf(
            HttpServletResponse response,
            @ModelAttribute DashboardFilter filter,
            @RequestParam(required = false) Boolean includeTurnover,
            @RequestParam(required = false) String viewId,
            @RequestHeader(value = "X-Share-Token", required = false) String shareToken) throws IOException {

        if (viewId != null && !viewId.isBlank()) {
            filter.setViewId(viewId);
        }
        filter = ViewIdResolver.resolve(filterViewService, filter);

        if (!checkExportPermission(shareToken)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponse.error(403, "当前分享链接无导出权限，请联系分享者开通")));
            return;
        }

        boolean turnover = includeTurnover != null && includeTurnover;

        DashboardOverview overview = dashboardService.getOverview(filter, shareToken);
        List<VehicleArchiveTrend> trend = dashboardService.getVehicleTrend(filter, shareToken);
        InspectionReportComposition inspection = dashboardService.getInspectionReport(filter, shareToken);
        PrepListDetail prep = dashboardService.getPrepList(filter, shareToken);
        TestDriveAnomaly testDrive = dashboardService.getTestDriveAnomaly(filter, shareToken);

        String filename = "二手车车源上架趋势报告_" + LocalDateTime.now().format(FORMATTER) + ".pdf";
        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"" + URLEncoder.encode(filename, StandardCharsets.UTF_8) + "\"");

        try (OutputStream out = response.getOutputStream()) {
            pdfExportService.writePdf(out, overview, trend, inspection, prep, testDrive, turnover);
        }
    }

    @GetMapping("/export/excel")
    public void exportExcel(
            HttpServletResponse response,
            @ModelAttribute DashboardFilter filter,
            @RequestParam(required = false) Boolean includeTurnover,
            @RequestParam(required = false) String viewId,
            @RequestHeader(value = "X-Share-Token", required = false) String shareToken) throws IOException {

        if (viewId != null && !viewId.isBlank()) {
            filter.setViewId(viewId);
        }
        filter = ViewIdResolver.resolve(filterViewService, filter);

        if (!checkExportPermission(shareToken)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponse.error(403, "当前分享链接无导出权限，请联系分享者开通")));
            return;
        }

        boolean turnover = includeTurnover != null && includeTurnover;

        DashboardOverview overview = dashboardService.getOverview(filter, shareToken);
        List<VehicleArchiveTrend> trend = dashboardService.getVehicleTrend(filter, shareToken);
        InspectionReportComposition inspection = dashboardService.getInspectionReport(filter, shareToken);
        PrepListDetail prep = dashboardService.getPrepList(filter, shareToken);
        TestDriveAnomaly testDrive = dashboardService.getTestDriveAnomaly(filter, shareToken);

        String filename = "二手车车源上架趋势报告_" + LocalDateTime.now().format(FORMATTER) + ".xlsx";
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition",
                "attachment; filename=\"" + URLEncoder.encode(filename, StandardCharsets.UTF_8) + "\"");

        try (OutputStream out = response.getOutputStream()) {
            excelExportService.writeExcel(out, overview, trend, inspection, prep, testDrive, turnover);
        }
    }

    private boolean checkExportPermission(String shareToken) {
        if (shareToken == null || shareToken.isBlank()) {
            return true;
        }
        try {
            ShareLinkValidation validation = shareLinkService.validateShareLink(shareToken);
            if (!validation.getValid()) {
                log.warn("Share token validation failed: {}", shareToken);
                return false;
            }
            boolean hasExport = validation.getPermissions() != null
                    && validation.getPermissions().contains("export");
            if (!hasExport) {
                log.warn("Share token has no export permission: {}", shareToken);
            }
            return hasExport;
        } catch (Exception e) {
            log.error("Error checking share token permission", e);
            return false;
        }
    }
}
