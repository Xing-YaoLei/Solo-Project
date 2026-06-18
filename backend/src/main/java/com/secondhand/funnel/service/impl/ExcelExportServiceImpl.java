package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.dto.FunnelStageStatsDTO;
import com.secondhand.funnel.dto.FunnelStatsDTO;
import com.secondhand.funnel.entity.CarInventory;
import com.secondhand.funnel.entity.InventoryTurnover;
import com.secondhand.funnel.repository.CarInventoryRepository;
import com.secondhand.funnel.repository.InventoryTurnoverRepository;
import com.secondhand.funnel.service.ExcelExportService;
import com.secondhand.funnel.service.FunnelStatsService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelExportServiceImpl implements ExcelExportService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final String[] TURNOVER_RULES = {
            "库存周转计算规则说明",
            "",
            "1. 库存天数定义:",
            "   - 从车辆入库（创建时间）到当前日期或出库日期的自然天数",
            "   - 库存天数 = 当前日期 - 车辆创建日期（未出库车辆）",
            "   - 库存天数 = 出库日期 - 车辆创建日期（已出库车辆）",
            "",
            "2. 周转阶段划分:",
            "   - 快速周转: 库存天数 ≤ 7 天",
            "   - 正常周转: 7 天 < 库存天数 ≤ 30 天",
            "   - 滞销售后: 30 天 < 库存天数 ≤ 60 天",
            "   - 长期库存: 库存天数 > 60 天",
            "",
            "3. 平均库存天数计算:",
            "   - 平均库存天数 = SUM(各车辆库存天数) / 车辆总数",
            "   - 仅统计在库车辆或已出库但有完整记录的车辆",
            "",
            "4. 周转率计算:",
            "   - 周转率 = 统计期内已售车辆数 / 期初库存量",
            "   - 周转天数 = 统计期天数 / 周转率"
    };

    private final FunnelStatsService funnelStatsService;
    private final CarInventoryRepository carInventoryRepository;
    private final InventoryTurnoverRepository inventoryTurnoverRepository;

    @Override
    public void exportFunnelStats(HttpServletResponse response) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);

            Sheet sheet = workbook.createSheet("漏斗统计数据");

            FunnelStatsDTO stats = funnelStatsService.getOverallStats();
            List<FunnelStageStatsDTO> stageStats = stats.getStageStats();

            int rowNum = 0;
            Row titleRow = sheet.createRow(rowNum++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("二手车上架漏斗统计报告");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));

            Row summaryRow = sheet.createRow(rowNum++);
            summaryRow.createCell(0).setCellValue("总车源数: " + stats.getTotalCars());
            summaryRow.createCell(1).setCellValue("已上架: " + stats.getListedCars());
            summaryRow.createCell(2).setCellValue("已售出: " + stats.getSoldCars());
            summaryRow.createCell(3).setCellValue("异常数: " + stats.getTotalAnomalies());
            summaryRow.createCell(4).setCellValue(String.format("转化率: %.2f%%", stats.getConversionRate()));
            summaryRow.createCell(5).setCellValue("平均库存天数: " + stats.getAvgDaysInInventory() + " 天");

            rowNum++;

            String[] headers = {"阶段", "阶段名称", "总数", "已完成", "进行中", "异常数"};
            Row headerRow = sheet.createRow(rowNum++);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            for (FunnelStageStatsDTO stage : stageStats) {
                Row row = sheet.createRow(rowNum++);
                createCell(row, 0, stage.getStage(), dataStyle);
                createCell(row, 1, stage.getStageName(), dataStyle);
                createCell(row, 2, stage.getTotalCount(), dataStyle);
                createCell(row, 3, stage.getCompletedCount(), dataStyle);
                createCell(row, 4, stage.getPendingCount(), dataStyle);
                createCell(row, 5, stage.getAnomalyCount(), dataStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 2000);
            }

            writeToResponse(workbook, response, "漏斗统计数据");
        }
    }

    @Override
    public void exportCarInventory(HttpServletResponse response) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            Sheet sheet = workbook.createSheet("车源库数据");

            String[] headers = {"ID", "车架号VIN", "车牌号", "品牌", "车型", "里程(公里)",
                    "上牌日期", "评估师ID", "状态", "源库延迟", "检测缺失", "创建时间", "更新时间"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            List<CarInventory> cars = carInventoryRepository.findAll();
            int rowNum = 1;
            for (CarInventory car : cars) {
                Row row = sheet.createRow(rowNum++);
                createCell(row, 0, car.getId(), dataStyle);
                createCell(row, 1, car.getCarVin(), dataStyle);
                createCell(row, 2, car.getPlateNumber(), dataStyle);
                createCell(row, 3, car.getBrand(), dataStyle);
                createCell(row, 4, car.getModel(), dataStyle);
                createCell(row, 5, car.getMileage(), dataStyle);
                createCell(row, 6, car.getRegisterDate() != null ?
                        car.getRegisterDate().format(DATE_FORMATTER) : "", dataStyle);
                createCell(row, 7, car.getAssessorId(), dataStyle);
                createCell(row, 8, car.getStatus() != null ? car.getStatus().name() : "", dataStyle);
                createCell(row, 9, Boolean.TRUE.equals(car.getSourceLibraryDelay()) ? "是" : "否", dataStyle);
                createCell(row, 10, Boolean.TRUE.equals(car.getDetectorMissing()) ? "是" : "否", dataStyle);
                createCell(row, 11, car.getCreatedAt() != null ?
                        car.getCreatedAt().format(DATE_TIME_FORMATTER) : "", dataStyle);
                createCell(row, 12, car.getUpdatedAt() != null ?
                        car.getUpdatedAt().format(DATE_TIME_FORMATTER) : "", dataStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 2000);
            }

            writeToResponse(workbook, response, "车源库数据");
        }
    }

    @Override
    public void exportInventoryTurnover(HttpServletResponse response) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle ruleStyle = createRuleStyle(workbook);

            Sheet sheet1 = workbook.createSheet("库存周转记录");

            String[] headers = {"ID", "车源ID", "库存天数", "周转阶段", "计算时间"};
            Row headerRow = sheet1.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            List<InventoryTurnover> records = inventoryTurnoverRepository.findAll();
            int rowNum = 1;
            for (InventoryTurnover record : records) {
                Row row = sheet1.createRow(rowNum++);
                createCell(row, 0, record.getId(), dataStyle);
                createCell(row, 1, record.getCarId(), dataStyle);
                createCell(row, 2, record.getDaysInInventory(), dataStyle);
                createCell(row, 3, record.getTurnoverStage() != null ? record.getTurnoverStage() : getTurnoverStage(record.getDaysInInventory()), dataStyle);
                createCell(row, 4, record.getCalculatedAt() != null ?
                        record.getCalculatedAt().format(DATE_TIME_FORMATTER) : "", dataStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet1.autoSizeColumn(i);
                sheet1.setColumnWidth(i, sheet1.getColumnWidth(i) + 2000);
            }

            Sheet sheet2 = workbook.createSheet("库存周转计算规则");
            for (int i = 0; i < TURNOVER_RULES.length; i++) {
                Row row = sheet2.createRow(i);
                Cell cell = row.createCell(0);
                cell.setCellValue(TURNOVER_RULES[i]);
                if (i == 0 || TURNOVER_RULES[i].endsWith(":")) {
                    cell.setCellStyle(headerStyle);
                } else {
                    cell.setCellStyle(ruleStyle);
                }
            }
            sheet2.setColumnWidth(0, 50 * 256);

            writeToResponse(workbook, response, "库存周转数据");
        }
    }

    private String getTurnoverStage(Integer days) {
        if (days == null) return "";
        if (days <= 7) return "快速周转";
        if (days <= 30) return "正常周转";
        if (days <= 60) return "滞销售后";
        return "长期库存";
    }

    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 18);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.LEFT);
        return style;
    }

    private CellStyle createRuleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.TOP);
        return style;
    }

    private void createCell(Row row, int col, Object value, CellStyle style) {
        Cell cell = row.createCell(col);
        if (value == null) {
            cell.setCellValue("");
        } else if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
        } else {
            cell.setCellValue(value.toString());
        }
        cell.setCellStyle(style);
    }

    private void writeToResponse(Workbook workbook, HttpServletResponse response, String filename) throws IOException {
        String encodedFilename = URLEncoder.encode(filename + ".xlsx", StandardCharsets.UTF_8)
                .replaceAll("\\+", "%20");
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename*=UTF-8''" + encodedFilename);
        response.setCharacterEncoding("UTF-8");

        try (OutputStream outputStream = response.getOutputStream()) {
            workbook.write(outputStream);
            outputStream.flush();
        }
        log.info("Excel导出成功: {}", filename);
    }
}
