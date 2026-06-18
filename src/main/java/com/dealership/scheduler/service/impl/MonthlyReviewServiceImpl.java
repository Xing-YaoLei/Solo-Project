package com.dealership.scheduler.service.impl;

import com.dealership.scheduler.dto.MonthlyReviewDTO;
import com.dealership.scheduler.dto.ReviewQueryDTO;
import com.dealership.scheduler.entity.CustomerLead;
import com.dealership.scheduler.entity.TestDriveAppointment;
import com.dealership.scheduler.repository.CustomerLeadRepository;
import com.dealership.scheduler.repository.NoShowRecordRepository;
import com.dealership.scheduler.repository.TestDriveAppointmentRepository;
import com.dealership.scheduler.service.MonthlyReviewService;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MonthlyReviewServiceImpl implements MonthlyReviewService {

    @Autowired
    private CustomerLeadRepository leadRepository;

    @Autowired
    private TestDriveAppointmentRepository appointmentRepository;

    @Autowired
    private NoShowRecordRepository noShowRepository;

    @Override
    public MonthlyReviewDTO generateReview(ReviewQueryDTO query, String operatorName) {
        if (query.getStartDate() == null) {
            query.setStartDate(LocalDate.now().withDayOfMonth(1));
        }
        if (query.getEndDate() == null) {
            query.setEndDate(LocalDate.now());
        }

        MonthlyReviewDTO dto = new MonthlyReviewDTO();
        dto.setStartDate(query.getStartDate());
        dto.setEndDate(query.getEndDate());
        dto.setGeneratedAt(LocalDateTime.now());
        dto.setOperatorName(operatorName);

        StringBuilder filterSb = new StringBuilder();
        filterSb.append("统计周期: ").append(query.getStartDate()).append(" 至 ").append(query.getEndDate());
        if (query.getSalesId() != null) {
            filterSb.append("; 销售ID: ").append(query.getSalesId());
        }
        if (query.getSource() != null) {
            filterSb.append("; 线索来源: ").append(query.getSource());
        }
        dto.setFilterConditions(filterSb.toString());

        List<CustomerLead> leads = leadRepository.findByCreateTimeBetween(
                query.getStartDate().atStartOfDay(),
                query.getEndDate().atTime(23, 59, 59));

        if (query.getSource() != null) {
            leads = leads.stream()
                    .filter(l -> l.getSource() != null && l.getSource().name().equals(query.getSource()))
                    .collect(Collectors.toList());
        }
        if (query.getSalesId() != null) {
            leads = leads.stream()
                    .filter(l -> l.getOwner() != null && l.getOwner().getId().equals(query.getSalesId()))
                    .collect(Collectors.toList());
        }

        dto.setTotalLeads(leads.size());

        int converted = (int) leads.stream()
                .filter(l -> l.getStatus() == CustomerLead.LeadStatus.CONVERTED)
                .count();
        dto.setConvertedLeads(converted);
        dto.setConversionRate(leads.isEmpty() ? 0.0 : (converted * 100.0 / leads.size()));

        Map<String, Integer> statusDist = new LinkedHashMap<>();
        for (CustomerLead.LeadStatus status : CustomerLead.LeadStatus.values()) {
            int count = (int) leads.stream().filter(l -> l.getStatus() == status).count();
            if (count > 0) {
                statusDist.put(status.name(), count);
            }
        }
        dto.setStatusDistribution(statusDist);

        List<TestDriveAppointment> appointments = appointmentRepository.findByDateRange(
                query.getStartDate(), query.getEndDate());
        if (query.getSalesId() != null) {
            appointments = appointments.stream()
                    .filter(a -> a.getSalesConsultant() != null && a.getSalesConsultant().getId().equals(query.getSalesId()))
                    .collect(Collectors.toList());
        }
        dto.setTotalAppointments(appointments.size());

        int completed = (int) appointments.stream()
                .filter(a -> a.getStatus() == TestDriveAppointment.AppointmentStatus.COMPLETED)
                .count();
        dto.setCompletedTestDrives(completed);

        int noShows = (int) appointments.stream()
                .filter(a -> a.getStatus() == TestDriveAppointment.AppointmentStatus.NO_SHOW)
                .count();
        dto.setNoShows(noShows);

        Map<String, String> salesPerf = new LinkedHashMap<>();
        Map<Long, List<CustomerLead>> bySales = leads.stream()
                .filter(l -> l.getOwner() != null)
                .collect(Collectors.groupingBy(l -> l.getOwner().getId()));
        for (Map.Entry<Long, List<CustomerLead>> entry : bySales.entrySet()) {
            String name = entry.getValue().get(0).getOwner().getRealName();
            int conv = (int) entry.getValue().stream()
                    .filter(l -> l.getStatus() == CustomerLead.LeadStatus.CONVERTED)
                    .count();
            salesPerf.put(name + "(转化/总数)", conv + "/" + entry.getValue().size());
        }
        dto.setSalesPerformance(salesPerf);

        return dto;
    }

    @Override
    public void exportToExcel(ReviewQueryDTO query, String operatorName, HttpServletResponse response) throws IOException {
        MonthlyReviewDTO review = generateReview(query, operatorName);

        try (Workbook workbook = new XSSFWorkbook()) {
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Sheet metaSheet = workbook.createSheet("导出信息");
            int metaRow = 0;
            metaSheet.createRow(metaRow).createCell(0).setCellValue("筛选条件");
            metaSheet.getRow(metaRow).createCell(1).setCellValue(review.getFilterConditions());
            metaRow++;
            metaSheet.createRow(metaRow).createCell(0).setCellValue("生成时间");
            metaSheet.getRow(metaRow).createCell(1).setCellValue(
                    review.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            metaRow++;
            metaSheet.createRow(metaRow).createCell(0).setCellValue("操作人");
            metaSheet.getRow(metaRow).createCell(1).setCellValue(review.getOperatorName());

            Sheet summarySheet = workbook.createSheet("复盘汇总");
            int rowIdx = 0;
            Row headerRow = summarySheet.createRow(rowIdx++);
            headerRow.createCell(0).setCellValue("指标");
            headerRow.createCell(1).setCellValue("数值");
            for (int i = 0; i < 2; i++) {
                headerRow.getCell(i).setCellStyle(headerStyle);
            }

            String[][] summaryData = {
                    {"总线索数", String.valueOf(review.getTotalLeads())},
                    {"已转化数", String.valueOf(review.getConvertedLeads())},
                    {"转化率", String.format("%.2f%%", review.getConversionRate())},
                    {"总预约数", String.valueOf(review.getTotalAppointments())},
                    {"已完成试驾", String.valueOf(review.getCompletedTestDrives())},
                    {"爽约数", String.valueOf(review.getNoShows())}
            };
            for (String[] row : summaryData) {
                Row r = summarySheet.createRow(rowIdx++);
                r.createCell(0).setCellValue(row[0]);
                r.createCell(1).setCellValue(row[1]);
            }

            Sheet statusSheet = workbook.createSheet("线索状态分布");
            rowIdx = 0;
            Row statusHeader = statusSheet.createRow(rowIdx++);
            statusHeader.createCell(0).setCellValue("状态");
            statusHeader.createCell(1).setCellValue("数量");
            statusHeader.getCell(0).setCellStyle(headerStyle);
            statusHeader.getCell(1).setCellStyle(headerStyle);
            for (Map.Entry<String, Integer> entry : review.getStatusDistribution().entrySet()) {
                Row r = statusSheet.createRow(rowIdx++);
                r.createCell(0).setCellValue(entry.getKey());
                r.createCell(1).setCellValue(entry.getValue());
            }

            Sheet leadsSheet = workbook.createSheet("线索明细");
            rowIdx = 0;
            Row leadsHeader = leadsSheet.createRow(rowIdx++);
            String[] leadHeaders = {"客户姓名", "电话", "意向车型", "状态", "来源", "负责人", "创建时间"};
            for (int i = 0; i < leadHeaders.length; i++) {
                leadsHeader.createCell(i).setCellValue(leadHeaders[i]);
                leadsHeader.getCell(i).setCellStyle(headerStyle);
            }

            List<CustomerLead> leads = leadRepository.findByCreateTimeBetween(
                    review.getStartDate().atStartOfDay(),
                    review.getEndDate().atTime(23, 59, 59));
            for (CustomerLead lead : leads) {
                Row r = leadsSheet.createRow(rowIdx++);
                r.createCell(0).setCellValue(lead.getCustomerName());
                r.createCell(1).setCellValue(lead.getPhone());
                r.createCell(2).setCellValue(lead.getIntendedVehicle() != null ? lead.getIntendedVehicle() : "");
                r.createCell(3).setCellValue(lead.getStatus() != null ? lead.getStatus().name() : "");
                r.createCell(4).setCellValue(lead.getSource() != null ? lead.getSource().name() : "");
                r.createCell(5).setCellValue(lead.getOwner() != null ? lead.getOwner().getRealName() : "");
                r.createCell(6).setCellValue(lead.getCreateTime() != null ?
                        lead.getCreateTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : "");
            }

            for (int i = 0; i < 7; i++) {
                leadsSheet.autoSizeColumn(i);
            }
            summarySheet.autoSizeColumn(0);
            summarySheet.autoSizeColumn(1);
            metaSheet.autoSizeColumn(0);
            metaSheet.autoSizeColumn(1);
            statusSheet.autoSizeColumn(0);
            statusSheet.autoSizeColumn(1);

            String fileName = "月度复盘_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=" +
                    URLEncoder.encode(fileName, StandardCharsets.UTF_8));
            try (OutputStream out = response.getOutputStream()) {
                workbook.write(out);
                out.flush();
            }
        }
    }
}
