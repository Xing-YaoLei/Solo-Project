package com.testdrive.service;

import com.testdrive.dto.ConversionStatVO;
import com.testdrive.dto.ExportMetaDTO;
import com.testdrive.dto.MonthlyReviewQueryDTO;
import com.testdrive.entity.Appointment;
import com.testdrive.entity.SalesFollowUp;
import com.testdrive.repository.AppointmentRepository;
import com.testdrive.repository.SalesFollowUpRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class MonthlyReviewService {

    private final AppointmentRepository appointmentRepository;
    private final SalesFollowUpRepository salesFollowUpRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String REVIEW_CACHE_PREFIX = "review:stats:";

    public List<ConversionStatVO> getConversionStats(MonthlyReviewQueryDTO query) {
        String cacheKey = REVIEW_CACHE_PREFIX + query.getYearMonth();
        @SuppressWarnings("unchecked")
        List<ConversionStatVO> cached = (List<ConversionStatVO>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        LocalDate start = LocalDate.parse(query.getYearMonth() + "-01");
        LocalDate end = start.plusMonths(1).minusDays(1);

        List<Appointment> appointments = appointmentRepository.findByAppointmentDateBetween(start, end);

        Map<String, Long> totalBySource = new LinkedHashMap<>();
        Map<String, Long> convertedBySource = new LinkedHashMap<>();

        for (Appointment apt : appointments) {
            List<SalesFollowUp> follows = salesFollowUpRepository.findByAppointmentId(apt.getId());
            String source = follows.isEmpty() ? "未知" : follows.get(0).getLeadSource();
            if (source == null) source = "未知";

            totalBySource.merge(source, 1L, Long::sum);
            if ("CONVERTED".equals(apt.getStatus())) {
                convertedBySource.merge(source, 1L, Long::sum);
            }
        }

        List<ConversionStatVO> stats = new ArrayList<>();
        for (String source : totalBySource.keySet()) {
            ConversionStatVO vo = new ConversionStatVO();
            vo.setCategory(source);
            vo.setTotal(totalBySource.getOrDefault(source, 0L));
            vo.setConverted(convertedBySource.getOrDefault(source, 0L));
            if (vo.getTotal() > 0) {
                vo.setRate(BigDecimal.valueOf(vo.getConverted())
                        .divide(BigDecimal.valueOf(vo.getTotal()), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)));
            } else {
                vo.setRate(BigDecimal.ZERO);
            }
            stats.add(vo);
        }

        redisTemplate.opsForValue().set(cacheKey, stats, 30, TimeUnit.MINUTES);
        return stats;
    }

    public byte[] exportMonthlyReport(MonthlyReviewQueryDTO query, String operator) throws IOException {
        List<ConversionStatVO> stats = getConversionStats(query);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet metaSheet = workbook.createSheet("导出说明");
            Row metaRow1 = metaSheet.createRow(0);
            metaRow1.createCell(0).setCellValue("筛选口径");
            metaRow1.createCell(1).setCellValue(buildFilterCriteria(query));
            Row metaRow2 = metaSheet.createRow(1);
            metaRow2.createCell(0).setCellValue("生成时间");
            metaRow2.createCell(1).setCellValue(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            Row metaRow3 = metaSheet.createRow(2);
            metaRow3.createCell(0).setCellValue("操作者");
            metaRow3.createCell(1).setCellValue(operator);

            Sheet dataSheet = workbook.createSheet("线索转化统计");
            Row header = dataSheet.createRow(0);
            header.createCell(0).setCellValue("线索来源");
            header.createCell(1).setCellValue("总线索数");
            header.createCell(2).setCellValue("转化数");
            header.createCell(3).setCellValue("转化率(%)");

            int rowIdx = 1;
            for (ConversionStatVO stat : stats) {
                Row row = dataSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(stat.getCategory());
                row.createCell(1).setCellValue(stat.getTotal());
                row.createCell(2).setCellValue(stat.getConverted());
                row.createCell(3).setCellValue(stat.getRate().doubleValue());
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public ExportMetaDTO getExportMeta(MonthlyReviewQueryDTO query, String operator) {
        ExportMetaDTO meta = new ExportMetaDTO();
        meta.setFilterCriteria(buildFilterCriteria(query));
        meta.setGeneratedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        meta.setOperator(operator);
        return meta;
    }

    private String buildFilterCriteria(MonthlyReviewQueryDTO query) {
        StringBuilder sb = new StringBuilder();
        sb.append("月份: ").append(query.getYearMonth());
        if (query.getSalesPerson() != null) {
            sb.append("; 销售: ").append(query.getSalesPerson());
        }
        if (query.getLeadSource() != null) {
            sb.append("; 来源: ").append(query.getLeadSource());
        }
        if (query.getLeadStatus() != null) {
            sb.append("; 状态: ").append(query.getLeadStatus());
        }
        return sb.toString();
    }
}
