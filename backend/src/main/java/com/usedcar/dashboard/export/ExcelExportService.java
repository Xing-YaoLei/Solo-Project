package com.usedcar.dashboard.export;

import com.usedcar.dashboard.dto.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class ExcelExportService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String TURNOVER_DEFINITION = "库存周转口径定义：\n"
            + "1. 平均周转天数 = 库存车辆在库天数总和 / 在库车辆数（按统计期末时点计算）；\n"
            + "2. 周转率 = 统计周期内销售出库车辆数 / 统计期平均库存数，其中平均库存数 = (期初库存 + 期末库存) / 2；\n"
            + "3. 快消车辆：入库到销售出库天数 ≤ 30 天的车辆；\n"
            + "4. 滞销车辆：入库后在库天数 ≥ 90 天且仍未出库的车辆；\n"
            + "5. 统计周期默认取筛选条件中的起止日期，未选择时取最近 30 天。";

    public void writeExcel(OutputStream out,
                           DashboardOverview overview,
                           List<VehicleArchiveTrend> trend,
                           InspectionReportComposition inspection,
                           PrepListDetail prep,
                           TestDriveAnomaly testDrive,
                           boolean includeTurnover) throws IOException {

        try (Workbook wb = new XSSFWorkbook()) {
            CellStyle headerStyle = createHeaderStyle(wb);
            CellStyle dataStyle = createDataStyle(wb);
            CellStyle titleStyle = createTitleStyle(wb);

            createOverviewSheet(wb, overview, headerStyle, dataStyle, titleStyle);
            createVehicleTrendSheet(wb, trend, headerStyle, dataStyle, titleStyle);
            createInspectionSheet(wb, inspection, headerStyle, dataStyle, titleStyle);
            createPrepListSheet(wb, prep, headerStyle, dataStyle, titleStyle);
            createTestDriveSheet(wb, testDrive, headerStyle, dataStyle, titleStyle);

            if (includeTurnover) {
                createTurnoverSheet(wb, overview, headerStyle, dataStyle, titleStyle);
            }

            wb.write(out);
        }
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createDataStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle createTitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 14);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createSubtitleStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle createAltRowStyle(Workbook wb) {
        CellStyle style = createDataStyle(wb);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }

    private void addTitleAndSubtitle(Sheet sheet, String title, int lastCol) {
        Workbook wb = sheet.getWorkbook();
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(title);
        titleCell.setCellStyle(createTitleStyle(wb));
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, lastCol));

        Row subRow = sheet.createRow(1);
        Cell subCell = subRow.createCell(0);
        subCell.setCellValue("生成时间：" + LocalDateTime.now(ZoneId.of("Asia/Shanghai")).format(FORMATTER));
        subCell.setCellStyle(createSubtitleStyle(wb));
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, lastCol));
    }

    private void setCellValue(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value == null ? "-" : value);
        cell.setCellStyle(style);
    }

    private void autoSizeColumns(Sheet sheet, int count) {
        for (int i = 0; i < count; i++) {
            sheet.autoSizeColumn(i);
            sheet.setColumnWidth(i, Math.min(sheet.getColumnWidth(i) + 1000, 15000));
        }
    }

    private void createOverviewSheet(Workbook wb, DashboardOverview overview,
                                     CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        Sheet sheet = wb.createSheet("概览");
        addTitleAndSubtitle(sheet, "数据概览", 2);

        DashboardOverview.Summary s = overview != null ? overview.getSummary() : null;

        Row headerRow = sheet.createRow(3);
        String[] headers = {"指标", "数值", "说明"};
        for (int i = 0; i < headers.length; i++) {
            Cell c = headerRow.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(headerStyle);
        }

        CellStyle altStyle = createAltRowStyle(wb);

        String[][] data = {
                {"在架总数", s != null && s.getTotalListed() != null ? s.getTotalListed().toString() : "-", "当前统计范围内上架中车辆数"},
                {"周同比", s != null && s.getWeekOverWeek() != null ? formatPercent(s.getWeekOverWeek()) : "-", "相比上周同期变化率"},
                {"月环比", s != null && s.getMonthOverMonth() != null ? formatPercent(s.getMonthOverMonth()) : "-", "相比上月同期变化率"},
                {"检测合格率", s != null && s.getInspectionPassRate() != null ? formatPercent(s.getInspectionPassRate()) : "-", "通过检测报告数 / 总检测报告数"},
                {"平均整备天数", s != null && s.getAvgPrepDays() != null ? String.format("%.1f 天", s.getAvgPrepDays()) : "-", "车辆从入店到上架完成平均耗时"},
                {"试驾异常数", s != null && s.getAbnormalTestDrives() != null ? s.getAbnormalTestDrives().toString() : "-", "试驾过程中发生异常事件数量"}
        };

        for (int i = 0; i < data.length; i++) {
            Row row = sheet.createRow(4 + i);
            CellStyle style = i % 2 == 0 ? dataStyle : altStyle;
            for (int j = 0; j < data[i].length; j++) {
                setCellValue(row, j, data[i][j], style);
            }
        }

        autoSizeColumns(sheet, 3);
    }

    private void createVehicleTrendSheet(Workbook wb, List<VehicleArchiveTrend> trend,
                                         CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        Sheet sheet = wb.createSheet("车辆档案趋势");
        addTitleAndSubtitle(sheet, "车辆档案趋势（最近30天）", 3);

        Row headerRow = sheet.createRow(3);
        String[] headers = {"日期", "上架", "下架", "净增"};
        for (int i = 0; i < headers.length; i++) {
            Cell c = headerRow.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(headerStyle);
        }

        CellStyle altStyle = createAltRowStyle(wb);

        int rowIdx = 4;
        if (trend != null) {
            for (int i = 0; i < trend.size(); i++) {
                VehicleArchiveTrend t = trend.get(i);
                Row row = sheet.createRow(rowIdx++);
                CellStyle style = i % 2 == 0 ? dataStyle : altStyle;
                setCellValue(row, 0, t.getPeriod(), style);
                setCellValue(row, 1, t.getListed() != null ? t.getListed().toString() : "0", style);
                setCellValue(row, 2, t.getDelisted() != null ? t.getDelisted().toString() : "0", style);
                setCellValue(row, 3, t.getNetChange() != null ? t.getNetChange().toString() : "0", style);
            }
        }

        autoSizeColumns(sheet, 4);
    }

    private void createInspectionSheet(Workbook wb, InspectionReportComposition inspection,
                                       CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        Sheet sheet = wb.createSheet("检测报告构成");
        addTitleAndSubtitle(sheet, "检测报告构成", 2);

        int rowIdx = 3;
        CellStyle altStyle = createAltRowStyle(wb);

        if (inspection != null) {
            Row infoRow = sheet.createRow(rowIdx++);
            infoRow.createCell(0).setCellValue("检测报告总数：" + (inspection.getTotalReports() != null ? inspection.getTotalReports() : 0)
                    + "    合格率：" + (inspection.getPassRate() != null ? formatPercent(inspection.getPassRate()) : "-"));
            sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 2));
            rowIdx++;
        }

        Row headerRow = sheet.createRow(rowIdx++);
        String[] headers = {"分类", "数量", "占比"};
        for (int i = 0; i < headers.length; i++) {
            Cell c = headerRow.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(headerStyle);
        }

        if (inspection != null && inspection.getCategoryDistribution() != null) {
            int total = inspection.getTotalReports() != null ? inspection.getTotalReports() : 1;
            int i = 0;
            for (Map.Entry<String, Integer> entry : inspection.getCategoryDistribution().entrySet()) {
                Row row = sheet.createRow(rowIdx++);
                CellStyle style = i % 2 == 0 ? dataStyle : altStyle;
                double ratio = entry.getValue() * 100.0 / total;
                setCellValue(row, 0, entry.getKey(), style);
                setCellValue(row, 1, entry.getValue().toString(), style);
                setCellValue(row, 2, String.format("%.1f%%", ratio), style);
                i++;
            }
        }

        autoSizeColumns(sheet, 3);
    }

    private void createPrepListSheet(Workbook wb, PrepListDetail prep,
                                     CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        Sheet sheet = wb.createSheet("整备清单明细");
        addTitleAndSubtitle(sheet, "整备清单明细", 6);

        int rowIdx = 3;
        CellStyle altStyle = createAltRowStyle(wb);

        if (prep != null) {
            Row infoRow = sheet.createRow(rowIdx++);
            infoRow.createCell(0).setCellValue("平均整备天数："
                    + (prep.getAvgPrepDays() != null ? String.format("%.1f 天", prep.getAvgPrepDays()) : "-"));
            sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 6));
            rowIdx++;

            if (prep.getStatusDistribution() != null && !prep.getStatusDistribution().isEmpty()) {
                Row statusTitle = sheet.createRow(rowIdx++);
                statusTitle.createCell(0).setCellValue("状态分布");
                sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 6));

                Row statusHeader = sheet.createRow(rowIdx++);
                Cell h0 = statusHeader.createCell(0);
                h0.setCellValue("状态");
                h0.setCellStyle(headerStyle);
                Cell h1 = statusHeader.createCell(1);
                h1.setCellValue("数量");
                h1.setCellStyle(headerStyle);

                int i = 0;
                for (Map.Entry<String, Integer> entry : prep.getStatusDistribution().entrySet()) {
                    Row row = sheet.createRow(rowIdx++);
                    CellStyle style = i % 2 == 0 ? dataStyle : altStyle;
                    setCellValue(row, 0, entry.getKey(), style);
                    setCellValue(row, 1, entry.getValue().toString(), style);
                    i++;
                }
                rowIdx++;
            }

            if (prep.getOverdueItems() != null && !prep.getOverdueItems().isEmpty()) {
                Row overdueTitle = sheet.createRow(rowIdx++);
                overdueTitle.createCell(0).setCellValue("超期车辆清单");
                sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 6));

                Row headerRow = sheet.createRow(rowIdx++);
                String[] headers = {"车辆ID", "品牌", "车型", "金融审批", "状态", "已整备(天)", "预期(天)"};
                for (int i = 0; i < headers.length; i++) {
                    Cell c = headerRow.createCell(i);
                    c.setCellValue(headers[i]);
                    c.setCellStyle(headerStyle);
                }

                for (int i = 0; i < prep.getOverdueItems().size(); i++) {
                    PrepOverdueItem item = prep.getOverdueItems().get(i);
                    Row row = sheet.createRow(rowIdx++);
                    CellStyle style = i % 2 == 0 ? dataStyle : altStyle;
                    setCellValue(row, 0, item.getVehicleId(), style);
                    setCellValue(row, 1, item.getBrand(), style);
                    setCellValue(row, 2, item.getModel(), style);
                    setCellValue(row, 3, item.getFinanceApproval(), style);
                    setCellValue(row, 4, item.getStatus(), style);
                    setCellValue(row, 5, item.getPrepDays() != null ? item.getPrepDays().toString() : "-", style);
                    setCellValue(row, 6, item.getExpectedDays() != null ? item.getExpectedDays().toString() : "-", style);
                }
            }
        }

        autoSizeColumns(sheet, 7);
    }

    private void createTestDriveSheet(Workbook wb, TestDriveAnomaly testDrive,
                                      CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        Sheet sheet = wb.createSheet("试驾异常标注");
        addTitleAndSubtitle(sheet, "试驾异常标注", 4);

        int rowIdx = 3;
        CellStyle altStyle = createAltRowStyle(wb);

        if (testDrive != null) {
            int total = testDrive.getTotalDrives() != null ? testDrive.getTotalDrives() : 0;
            int abnormal = testDrive.getAbnormalCount() != null ? testDrive.getAbnormalCount() : 0;
            double rate = total > 0 ? abnormal * 100.0 / total : 0;

            Row infoRow = sheet.createRow(rowIdx++);
            infoRow.createCell(0).setCellValue(String.format("试驾总数：%d    异常数：%d    异常率：%.2f%%", total, abnormal, rate));
            sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));
            rowIdx++;

            if (testDrive.getDailyDistribution() != null && !testDrive.getDailyDistribution().isEmpty()) {
                Row dailyTitle = sheet.createRow(rowIdx++);
                dailyTitle.createCell(0).setCellValue("试驾日期分布");
                sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));

                Row dailyHeader = sheet.createRow(rowIdx++);
                String[] dh = {"日期", "正常", "异常"};
                for (int i = 0; i < dh.length; i++) {
                    Cell c = dailyHeader.createCell(i);
                    c.setCellValue(dh[i]);
                    c.setCellStyle(headerStyle);
                }

                for (int i = 0; i < testDrive.getDailyDistribution().size(); i++) {
                    DailyDriveDistribution d = testDrive.getDailyDistribution().get(i);
                    Row row = sheet.createRow(rowIdx++);
                    CellStyle style = i % 2 == 0 ? dataStyle : altStyle;
                    setCellValue(row, 0, d.getDate(), style);
                    setCellValue(row, 1, d.getNormalCount() != null ? d.getNormalCount().toString() : "0", style);
                    setCellValue(row, 2, d.getAbnormalCount() != null ? d.getAbnormalCount().toString() : "0", style);
                }
                rowIdx++;
            }

            if (testDrive.getAnomalies() != null && !testDrive.getAnomalies().isEmpty()) {
                Row anomalyTitle = sheet.createRow(rowIdx++);
                anomalyTitle.createCell(0).setCellValue("异常明细");
                sheet.addMergedRegion(new CellRangeAddress(rowIdx - 1, rowIdx - 1, 0, 4));

                Row headerRow = sheet.createRow(rowIdx++);
                String[] headers = {"车辆ID", "日期", "类型", "描述", "严重度"};
                for (int i = 0; i < headers.length; i++) {
                    Cell c = headerRow.createCell(i);
                    c.setCellValue(headers[i]);
                    c.setCellStyle(headerStyle);
                }

                for (int i = 0; i < testDrive.getAnomalies().size(); i++) {
                    AnomalyItem a = testDrive.getAnomalies().get(i);
                    Row row = sheet.createRow(rowIdx++);
                    CellStyle style = i % 2 == 0 ? dataStyle : altStyle;
                    setCellValue(row, 0, a.getVehicleId(), style);
                    setCellValue(row, 1, a.getDate(), style);
                    setCellValue(row, 2, a.getType(), style);
                    setCellValue(row, 3, a.getDescription(), style);
                    setCellValue(row, 4, a.getSeverity(), style);
                }
            }
        }

        autoSizeColumns(sheet, 5);
    }

    private void createTurnoverSheet(Workbook wb, DashboardOverview overview,
                                     CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        Sheet sheet = wb.createSheet("库存周转口径");
        addTitleAndSubtitle(sheet, "库存周转口径", 2);

        DashboardOverview.InventoryTurnoverMetrics t = overview != null ? overview.getTurnover() : null;
        CellStyle altStyle = createAltRowStyle(wb);

        Row headerRow = sheet.createRow(3);
        String[] headers = {"指标", "数值"};
        for (int i = 0; i < headers.length; i++) {
            Cell c = headerRow.createCell(i);
            c.setCellValue(headers[i]);
            c.setCellStyle(headerStyle);
        }

        String[][] data = {
                {"平均周转天数", t != null && t.getAvgTurnoverDays() != null ? String.format("%.1f 天", t.getAvgTurnoverDays()) : "-"},
                {"周转率", t != null && t.getTurnoverRate() != null ? formatPercent(t.getTurnoverRate()) : "-"},
                {"快消车辆数(≤30天)", t != null && t.getFastMovingCount() != null ? t.getFastMovingCount().toString() : "-"},
                {"滞销车辆数(≥90天)", t != null && t.getSlowMovingCount() != null ? t.getSlowMovingCount().toString() : "-"}
        };

        for (int i = 0; i < data.length; i++) {
            Row row = sheet.createRow(4 + i);
            CellStyle style = i % 2 == 0 ? dataStyle : altStyle;
            for (int j = 0; j < data[i].length; j++) {
                setCellValue(row, j, data[i][j], style);
            }
        }

        int defTitleRow = 4 + data.length + 2;
        Row defTitle = sheet.createRow(defTitleRow);
        Cell defTitleCell = defTitle.createCell(0);
        Font boldFont = wb.createFont();
        boldFont.setBold(true);
        CellStyle defTitleStyle = wb.createCellStyle();
        defTitleStyle.setFont(boldFont);
        defTitleCell.setCellValue("口径定义说明：");
        defTitleCell.setCellStyle(defTitleStyle);
        sheet.addMergedRegion(new CellRangeAddress(defTitleRow, defTitleRow, 0, 2));

        Row defRow = sheet.createRow(defTitleRow + 1);
        Cell defCell = defRow.createCell(0);
        String def = t != null && t.getDefinition() != null ? t.getDefinition() : TURNOVER_DEFINITION;
        defCell.setCellValue(def);
        CellStyle defStyle = wb.createCellStyle();
        defStyle.setWrapText(true);
        defStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        defStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        defStyle.setVerticalAlignment(VerticalAlignment.TOP);
        defCell.setCellStyle(defStyle);
        sheet.addMergedRegion(new CellRangeAddress(defTitleRow + 1, defTitleRow + 4, 0, 2));

        autoSizeColumns(sheet, 3);
    }

    private String formatPercent(Double d) {
        if (d == null) return "-";
        return String.format("%.2f%%", d * 100);
    }
}
