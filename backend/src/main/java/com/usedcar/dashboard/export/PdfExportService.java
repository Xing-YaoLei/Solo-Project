package com.usedcar.dashboard.export;

import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.usedcar.dashboard.dto.*;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class PdfExportService {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DeviceRgb HEADER_BG = new DeviceRgb(66, 133, 244);
    private static final DeviceRgb LIGHT_BG = new DeviceRgb(245, 247, 250);
    private static final String TURNOVER_DEFINITION = "库存周转口径定义：\n"
            + "1. 平均周转天数 = 库存车辆在库天数总和 / 在库车辆数（按统计期末时点计算）；\n"
            + "2. 周转率 = 统计周期内销售出库车辆数 / 统计期平均库存数，其中平均库存数 = (期初库存 + 期末库存) / 2；\n"
            + "3. 快消车辆：入库到销售出库天数 ≤ 30 天的车辆；\n"
            + "4. 滞销车辆：入库后在库天数 ≥ 90 天且仍未出库的车辆；\n"
            + "5. 统计周期默认取筛选条件中的起止日期，未选择时取最近 30 天。";

    public void writePdf(OutputStream out,
                         DashboardOverview overview,
                         List<VehicleArchiveTrend> trend,
                         InspectionReportComposition inspection,
                         PrepListDetail prep,
                         TestDriveAnomaly testDrive,
                         boolean includeTurnover) throws IOException {

        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        try (Document document = new Document(pdf)) {
            PdfFont font = getChineseFont();

            document.setFont(font);

            addTitle(document, font);
            addSubtitle(document, font, overview);

            addSection1Overview(document, font, overview);
            addSection2VehicleTrend(document, font, trend);
            addSection3Inspection(document, font, inspection);
            addSection4PrepList(document, font, prep);
            addSection5TestDrive(document, font, testDrive);

            if (includeTurnover) {
                addSection6Turnover(document, font, overview);
            }
        }
    }

    private PdfFont getChineseFont() throws IOException {
        try {
            return PdfFontFactory.createFont("STSong-Light", "UniGB-UCS2-H", PdfFontFactory.EmbeddingStrategy.PREFER_EMBEDDED);
        } catch (Exception e) {
            return PdfFontFactory.createFont();
        }
    }

    private void addTitle(Document document, PdfFont font) {
        Paragraph title = new Paragraph()
                .add(new Text("二手车车源上架趋势报告").setFont(font).setFontSize(22).setBold())
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(8);
        document.add(title);
    }

    private void addSubtitle(Document document, PdfFont font, DashboardOverview overview) {
        String time = LocalDateTime.now(ZoneId.of("Asia/Shanghai")).format(FORMATTER);
        StringBuilder sb = new StringBuilder();
        sb.append("生成时间：").append(time);
        if (overview != null && overview.getLastRefreshTime() != null) {
            sb.append("    数据更新：").append(overview.getLastRefreshTime());
        }
        Paragraph subtitle = new Paragraph()
                .add(new Text(sb.toString()).setFont(font).setFontSize(10))
                .setTextAlignment(TextAlignment.CENTER)
                .setFontColor(ColorConstants.DARK_GRAY)
                .setMarginBottom(20);
        document.add(subtitle);
    }

    private void addSectionHeader(Document document, PdfFont font, String title) {
        Paragraph p = new Paragraph()
                .add(new Text(title).setFont(font).setFontSize(14).setBold())
                .setMarginTop(16)
                .setMarginBottom(8)
                .setFontColor(HEADER_BG);
        document.add(p);
    }

    private Cell createHeaderCell(PdfFont font, String text) {
        return new Cell()
                .add(new Paragraph(text).setFont(font).setFontSize(10).setBold().setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(HEADER_BG)
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(6);
    }

    private Cell createDataCell(PdfFont font, String text, boolean altRow) {
        Cell cell = new Cell()
                .add(new Paragraph(text == null ? "-" : text).setFont(font).setFontSize(10))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(5);
        if (altRow) {
            cell.setBackgroundColor(LIGHT_BG);
        }
        return cell;
    }

    private void addSection1Overview(Document document, PdfFont font, DashboardOverview overview) {
        addSectionHeader(document, font, "一、数据概览");

        DashboardOverview.Summary s = overview != null ? overview.getSummary() : null;
        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1})).useAllAvailableWidth();

        table.addCell(createHeaderCell(font, "指标"));
        table.addCell(createHeaderCell(font, "数值"));
        table.addCell(createHeaderCell(font, "说明"));

        int i = 0;
        table.addCell(createDataCell(font, "在架总数", i % 2 == 0));
        table.addCell(createDataCell(font, s != null && s.getTotalListed() != null ? s.getTotalListed().toString() : "-", i % 2 == 0));
        table.addCell(createDataCell(font, "当前统计范围内上架中车辆数", i++ % 2 == 0));

        table.addCell(createDataCell(font, "周同比", i % 2 == 0));
        table.addCell(createDataCell(font, s != null && s.getWeekOverWeek() != null ? formatPercent(s.getWeekOverWeek()) : "-", i % 2 == 0));
        table.addCell(createDataCell(font, "相比上周同期变化率", i++ % 2 == 0));

        table.addCell(createDataCell(font, "月环比", i % 2 == 0));
        table.addCell(createDataCell(font, s != null && s.getMonthOverMonth() != null ? formatPercent(s.getMonthOverMonth()) : "-", i % 2 == 0));
        table.addCell(createDataCell(font, "相比上月同期变化率", i++ % 2 == 0));

        table.addCell(createDataCell(font, "检测合格率", i % 2 == 0));
        table.addCell(createDataCell(font, s != null && s.getInspectionPassRate() != null ? formatPercent(s.getInspectionPassRate()) : "-", i % 2 == 0));
        table.addCell(createDataCell(font, "通过检测报告数 / 总检测报告数", i++ % 2 == 0));

        table.addCell(createDataCell(font, "平均整备天数", i % 2 == 0));
        table.addCell(createDataCell(font, s != null && s.getAvgPrepDays() != null ? String.format("%.1f 天", s.getAvgPrepDays()) : "-", i % 2 == 0));
        table.addCell(createDataCell(font, "车辆从入店到上架完成平均耗时", i++ % 2 == 0));

        table.addCell(createDataCell(font, "试驾异常数", i % 2 == 0));
        table.addCell(createDataCell(font, s != null && s.getAbnormalTestDrives() != null ? s.getAbnormalTestDrives().toString() : "-", i % 2 == 0));
        table.addCell(createDataCell(font, "试驾过程中发生异常事件数量", i % 2 == 0));

        document.add(table);
    }

    private void addSection2VehicleTrend(Document document, PdfFont font, List<VehicleArchiveTrend> trend) {
        addSectionHeader(document, font, "二、车辆档案趋势（最近30天）");

        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 1, 1, 1})).useAllAvailableWidth();
        table.addCell(createHeaderCell(font, "日期"));
        table.addCell(createHeaderCell(font, "上架"));
        table.addCell(createHeaderCell(font, "下架"));
        table.addCell(createHeaderCell(font, "净增"));

        if (trend != null) {
            for (int i = 0; i < trend.size(); i++) {
                VehicleArchiveTrend t = trend.get(i);
                boolean alt = i % 2 == 0;
                table.addCell(createDataCell(font, t.getPeriod(), alt));
                table.addCell(createDataCell(font, t.getListed() != null ? t.getListed().toString() : "0", alt));
                table.addCell(createDataCell(font, t.getDelisted() != null ? t.getDelisted().toString() : "0", alt));
                table.addCell(createDataCell(font, t.getNetChange() != null ? t.getNetChange().toString() : "0", alt));
            }
        }

        document.add(table);
    }

    private void addSection3Inspection(Document document, PdfFont font, InspectionReportComposition inspection) {
        addSectionHeader(document, font, "三、检测报告构成");

        if (inspection == null) {
            document.add(new Paragraph("暂无数据").setFont(font).setFontSize(10));
            return;
        }

        Paragraph p = new Paragraph()
                .add(new Text("检测报告总数：" + (inspection.getTotalReports() != null ? inspection.getTotalReports() : 0)
                        + "    合格率：" + (inspection.getPassRate() != null ? formatPercent(inspection.getPassRate()) : "-"))
                        .setFont(font).setFontSize(10))
                .setMarginBottom(8);
        document.add(p);

        if (inspection.getCategoryDistribution() != null && !inspection.getCategoryDistribution().isEmpty()) {
            Table table = new Table(UnitValue.createPercentArray(new float[]{2, 1, 1})).useAllAvailableWidth();
            table.addCell(createHeaderCell(font, "分类"));
            table.addCell(createHeaderCell(font, "数量"));
            table.addCell(createHeaderCell(font, "占比"));

            int total = inspection.getTotalReports() != null ? inspection.getTotalReports() : 1;
            int i = 0;
            for (Map.Entry<String, Integer> entry : inspection.getCategoryDistribution().entrySet()) {
                boolean alt = i % 2 == 0;
                double ratio = entry.getValue() * 100.0 / total;
                table.addCell(createDataCell(font, entry.getKey(), alt));
                table.addCell(createDataCell(font, entry.getValue().toString(), alt));
                table.addCell(createDataCell(font, String.format("%.1f%%", ratio), alt));
                i++;
            }
            document.add(table);
        }
    }

    private void addSection4PrepList(Document document, PdfFont font, PrepListDetail prep) {
        addSectionHeader(document, font, "四、整备清单明细");

        if (prep == null) {
            document.add(new Paragraph("暂无数据").setFont(font).setFontSize(10));
            return;
        }

        Paragraph p = new Paragraph()
                .add(new Text("平均整备天数：" + (prep.getAvgPrepDays() != null ? String.format("%.1f 天", prep.getAvgPrepDays()) : "-"))
                        .setFont(font).setFontSize(10))
                .setMarginBottom(8);
        document.add(p);

        if (prep.getStatusDistribution() != null && !prep.getStatusDistribution().isEmpty()) {
            Table statusTable = new Table(UnitValue.createPercentArray(new float[]{1, 1})).useAllAvailableWidth();
            statusTable.addCell(createHeaderCell(font, "状态"));
            statusTable.addCell(createHeaderCell(font, "数量"));
            int i = 0;
            for (Map.Entry<String, Integer> entry : prep.getStatusDistribution().entrySet()) {
                boolean alt = i % 2 == 0;
                statusTable.addCell(createDataCell(font, entry.getKey(), alt));
                statusTable.addCell(createDataCell(font, entry.getValue().toString(), alt));
                i++;
            }
            document.add(statusTable);
        }

        if (prep.getOverdueItems() != null && !prep.getOverdueItems().isEmpty()) {
            Paragraph overdueTitle = new Paragraph()
                    .add(new Text("超期车辆清单：").setFont(font).setFontSize(11).setBold())
                    .setMarginTop(10);
            document.add(overdueTitle);

            Table table = new Table(UnitValue.createPercentArray(new float[]{1.2f, 1, 1.5f, 1, 1, 1, 1})).useAllAvailableWidth();
            table.addCell(createHeaderCell(font, "车辆ID"));
            table.addCell(createHeaderCell(font, "品牌"));
            table.addCell(createHeaderCell(font, "车型"));
            table.addCell(createHeaderCell(font, "金融审批"));
            table.addCell(createHeaderCell(font, "状态"));
            table.addCell(createHeaderCell(font, "已整备"));
            table.addCell(createHeaderCell(font, "预期"));

            for (int i = 0; i < prep.getOverdueItems().size(); i++) {
                PrepOverdueItem item = prep.getOverdueItems().get(i);
                boolean alt = i % 2 == 0;
                table.addCell(createDataCell(font, item.getVehicleId(), alt));
                table.addCell(createDataCell(font, item.getBrand(), alt));
                table.addCell(createDataCell(font, item.getModel(), alt));
                table.addCell(createDataCell(font, item.getFinanceApproval(), alt));
                table.addCell(createDataCell(font, item.getStatus(), alt));
                table.addCell(createDataCell(font, item.getPrepDays() != null ? item.getPrepDays() + " 天" : "-", alt));
                table.addCell(createDataCell(font, item.getExpectedDays() != null ? item.getExpectedDays() + " 天" : "-", alt));
            }
            document.add(table);
        }
    }

    private void addSection5TestDrive(Document document, PdfFont font, TestDriveAnomaly testDrive) {
        addSectionHeader(document, font, "五、试驾异常标注");

        if (testDrive == null) {
            document.add(new Paragraph("暂无数据").setFont(font).setFontSize(10));
            return;
        }

        int total = testDrive.getTotalDrives() != null ? testDrive.getTotalDrives() : 0;
        int abnormal = testDrive.getAbnormalCount() != null ? testDrive.getAbnormalCount() : 0;
        double rate = total > 0 ? abnormal * 100.0 / total : 0;

        Paragraph p = new Paragraph()
                .add(new Text(String.format("试驾总数：%d    异常数：%d    异常率：%.2f%%", total, abnormal, rate))
                        .setFont(font).setFontSize(10))
                .setMarginBottom(8);
        document.add(p);

        if (testDrive.getDailyDistribution() != null && !testDrive.getDailyDistribution().isEmpty()) {
            Table dailyTable = new Table(UnitValue.createPercentArray(new float[]{2, 1, 1})).useAllAvailableWidth();
            dailyTable.addCell(createHeaderCell(font, "日期"));
            dailyTable.addCell(createHeaderCell(font, "正常"));
            dailyTable.addCell(createHeaderCell(font, "异常"));
            for (int i = 0; i < testDrive.getDailyDistribution().size(); i++) {
                DailyDriveDistribution d = testDrive.getDailyDistribution().get(i);
                boolean alt = i % 2 == 0;
                dailyTable.addCell(createDataCell(font, d.getDate(), alt));
                dailyTable.addCell(createDataCell(font, d.getNormalCount() != null ? d.getNormalCount().toString() : "0", alt));
                dailyTable.addCell(createDataCell(font, d.getAbnormalCount() != null ? d.getAbnormalCount().toString() : "0", alt));
            }
            document.add(dailyTable);
        }

        if (testDrive.getAnomalies() != null && !testDrive.getAnomalies().isEmpty()) {
            Paragraph anomalyTitle = new Paragraph()
                    .add(new Text("异常明细：").setFont(font).setFontSize(11).setBold())
                    .setMarginTop(10);
            document.add(anomalyTitle);

            Table table = new Table(UnitValue.createPercentArray(new float[]{1.2f, 1.2f, 1, 2, 0.8f})).useAllAvailableWidth();
            table.addCell(createHeaderCell(font, "车辆ID"));
            table.addCell(createHeaderCell(font, "日期"));
            table.addCell(createHeaderCell(font, "类型"));
            table.addCell(createHeaderCell(font, "描述"));
            table.addCell(createHeaderCell(font, "严重度"));

            for (int i = 0; i < testDrive.getAnomalies().size(); i++) {
                AnomalyItem a = testDrive.getAnomalies().get(i);
                boolean alt = i % 2 == 0;
                table.addCell(createDataCell(font, a.getVehicleId(), alt));
                table.addCell(createDataCell(font, a.getDate(), alt));
                table.addCell(createDataCell(font, a.getType(), alt));
                table.addCell(createDataCell(font, a.getDescription(), alt));
                table.addCell(createDataCell(font, a.getSeverity(), alt));
            }
            document.add(table);
        }
    }

    private void addSection6Turnover(Document document, PdfFont font, DashboardOverview overview) {
        addSectionHeader(document, font, "六、库存周转口径");

        DashboardOverview.InventoryTurnoverMetrics t = overview != null ? overview.getTurnover() : null;

        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 1})).useAllAvailableWidth();
        table.addCell(createHeaderCell(font, "指标"));
        table.addCell(createHeaderCell(font, "数值"));

        int i = 0;
        table.addCell(createDataCell(font, "平均周转天数", i % 2 == 0));
        table.addCell(createDataCell(font, t != null && t.getAvgTurnoverDays() != null ? String.format("%.1f 天", t.getAvgTurnoverDays()) : "-", i++ % 2 == 0));

        table.addCell(createDataCell(font, "周转率", i % 2 == 0));
        table.addCell(createDataCell(font, t != null && t.getTurnoverRate() != null ? formatPercent(t.getTurnoverRate()) : "-", i++ % 2 == 0));

        table.addCell(createDataCell(font, "快消车辆数", i % 2 == 0));
        table.addCell(createDataCell(font, t != null && t.getFastMovingCount() != null ? t.getFastMovingCount().toString() : "-", i++ % 2 == 0));

        table.addCell(createDataCell(font, "滞销车辆数", i % 2 == 0));
        table.addCell(createDataCell(font, t != null && t.getSlowMovingCount() != null ? t.getSlowMovingCount().toString() : "-", i % 2 == 0));

        document.add(table);

        Paragraph defTitle = new Paragraph()
                .add(new Text("口径定义说明：").setFont(font).setFontSize(11).setBold())
                .setMarginTop(10);
        document.add(defTitle);

        String def = t != null && t.getDefinition() != null ? t.getDefinition() : TURNOVER_DEFINITION;
        Paragraph defPara = new Paragraph()
                .add(new Text(def).setFont(font).setFontSize(10))
                .setFontColor(ColorConstants.DARK_GRAY)
                .setBackgroundColor(LIGHT_BG)
                .setPadding(8);
        document.add(defPara);
    }

    private String formatPercent(Double d) {
        if (d == null) return "-";
        return String.format("%.2f%%", d * 100);
    }
}
