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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonthlyReviewService {

    private final AppointmentRepository appointmentRepository;
    private final SalesFollowUpRepository salesFollowUpRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String REVIEW_CACHE_PREFIX = "review:stats:";

    public List<ConversionStatVO> getConversionStats(MonthlyReviewQueryDTO query) {
        String cacheKey = buildCacheKey(query);
        @SuppressWarnings("unchecked")
        List<ConversionStatVO> cached = (List<ConversionStatVO>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        LocalDate start = LocalDate.parse(query.getYearMonth() + "-01");
        LocalDate end = start.plusMonths(1).minusDays(1);

        List<Appointment> appointments = appointmentRepository.findByAppointmentDateBetween(start, end);
        if (appointments.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> appointmentIds = appointments.stream().map(Appointment::getId).collect(Collectors.toList());
        Map<Long, Appointment> appointmentMap = appointments.stream()
                .collect(Collectors.toMap(Appointment::getId, a -> a));

        List<SalesFollowUp> filteredFollows = salesFollowUpRepository.findByAppointmentIdsWithFilters(
                appointmentIds,
                query.getSalesPerson(),
                query.getLeadSource(),
                query.getLeadStatus()
        );

        String groupField = query.getGroupBy() != null ? query.getGroupBy() : "leadSource";

        Map<String, List<SalesFollowUp>> grouped = new LinkedHashMap<>();
        for (SalesFollowUp sf : filteredFollows) {
            String key = resolveGroupKey(sf, groupField);
            grouped.computeIfAbsent(key, k -> new ArrayList<>()).add(sf);
        }

        List<ConversionStatVO> stats = new ArrayList<>();
        for (Map.Entry<String, List<SalesFollowUp>> entry : grouped.entrySet()) {
            ConversionStatVO vo = new ConversionStatVO();
            vo.setCategory(entry.getKey());
            long total = entry.getValue().size();
            long converted = entry.getValue().stream()
                    .filter(sf -> "CONVERTED".equals(sf.getLeadStatus()))
                    .count();
            vo.setTotal(total);
            vo.setConverted(converted);
            if (total > 0) {
                vo.setRate(BigDecimal.valueOf(converted)
                        .divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)));
            } else {
                vo.setRate(BigDecimal.ZERO);
            }
            if (query.getSalesPerson() != null) vo.setSalesPerson(query.getSalesPerson());
            if (query.getLeadSource() != null) vo.setLeadSource(query.getLeadSource());
            if (query.getLeadStatus() != null) vo.setLeadStatus(query.getLeadStatus());
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
            String groupField = query.getGroupBy() != null ? query.getGroupBy() : "leadSource";
            String groupLabel = resolveGroupLabel(groupField);

            Row header = dataSheet.createRow(0);
            header.createCell(0).setCellValue(groupLabel);
            header.createCell(1).setCellValue("总线索数");
            header.createCell(2).setCellValue("转化数");
            header.createCell(3).setCellValue("转化率(%)");
            if (query.getSalesPerson() != null) header.createCell(4).setCellValue("筛选-销售顾问");
            if (query.getLeadSource() != null) header.createCell(5).setCellValue("筛选-线索来源");
            if (query.getLeadStatus() != null) header.createCell(6).setCellValue("筛选-线索状态");

            int rowIdx = 1;
            for (ConversionStatVO stat : stats) {
                Row row = dataSheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(stat.getCategory());
                row.createCell(1).setCellValue(stat.getTotal());
                row.createCell(2).setCellValue(stat.getConverted());
                row.createCell(3).setCellValue(stat.getRate().doubleValue());
                int col = 4;
                if (query.getSalesPerson() != null) row.createCell(col++).setCellValue(query.getSalesPerson());
                if (query.getLeadSource() != null) row.createCell(col++).setCellValue(query.getLeadSource());
                if (query.getLeadStatus() != null) row.createCell(col++).setCellValue(query.getLeadStatus());
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

    private String resolveGroupKey(SalesFollowUp sf, String groupField) {
        return switch (groupField) {
            case "salesPerson" -> sf.getSalesPerson() != null ? sf.getSalesPerson() : "未知";
            case "leadStatus" -> sf.getLeadStatus() != null ? sf.getLeadStatus() : "未知";
            default -> sf.getLeadSource() != null ? sf.getLeadSource() : "未知";
        };
    }

    private String resolveGroupLabel(String groupField) {
        return switch (groupField) {
            case "salesPerson" -> "销售顾问";
            case "leadStatus" -> "线索状态";
            default -> "线索来源";
        };
    }

    private String buildCacheKey(MonthlyReviewQueryDTO query) {
        return REVIEW_CACHE_PREFIX + query.getYearMonth()
                + ":" + query.getSalesPerson()
                + ":" + query.getLeadSource()
                + ":" + query.getLeadStatus()
                + ":" + query.getGroupBy();
    }

    private String buildFilterCriteria(MonthlyReviewQueryDTO query) {
        StringBuilder sb = new StringBuilder();
        sb.append("月份: ").append(query.getYearMonth());
        String groupField = query.getGroupBy() != null ? query.getGroupBy() : "leadSource";
        sb.append("; 分组: ").append(resolveGroupLabel(groupField));
        if (query.getSalesPerson() != null && !query.getSalesPerson().isBlank()) {
            sb.append("; 销售: ").append(query.getSalesPerson());
        }
        if (query.getLeadSource() != null && !query.getLeadSource().isBlank()) {
            sb.append("; 来源: ").append(query.getLeadSource());
        }
        if (query.getLeadStatus() != null && !query.getLeadStatus().isBlank()) {
            sb.append("; 状态: ").append(query.getLeadStatus());
        }
        return sb.toString();
    }
}
