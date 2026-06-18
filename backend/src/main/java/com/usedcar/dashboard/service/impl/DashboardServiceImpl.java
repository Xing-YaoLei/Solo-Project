package com.usedcar.dashboard.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.usedcar.dashboard.dto.*;
import com.usedcar.dashboard.entity.DatasourceSyncLog;
import com.usedcar.dashboard.entity.FilterView;
import com.usedcar.dashboard.entity.InspectionReport;
import com.usedcar.dashboard.entity.PrepItem;
import com.usedcar.dashboard.entity.TestDrive;
import com.usedcar.dashboard.entity.VehicleSource;
import com.usedcar.dashboard.mapper.*;
import com.usedcar.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final String DEFINITION = "库存周转天数 = 统计期内平均库存量 / 统计期内日均出库量；周转率 = 统计期内出库总量 / 平均库存量；快消定义为≤30天，滞销定义为≥60天";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final long CACHE_TTL_MINUTES = 5;

    private static final Map<String, String> ANOMALY_TYPE_DESC = new HashMap<>();
    private static final Map<String, String> ANOMALY_SEVERITY_DESC = new HashMap<>();

    static {
        ANOMALY_TYPE_DESC.put("accident_test", "事故车辆被安排试驾");
        ANOMALY_TYPE_DESC.put("overspeed", "试驾过程中超速");
        ANOMALY_TYPE_DESC.put("unauthorized_route", "偏离规定试驾路线");
        ANOMALY_TYPE_DESC.put("long_duration", "试驾时长异常偏长");

        ANOMALY_SEVERITY_DESC.put("low", "低");
        ANOMALY_SEVERITY_DESC.put("medium", "中");
        ANOMALY_SEVERITY_DESC.put("high", "高");
    }

    private final VehicleSourceMapper vehicleSourceMapper;
    private final InspectionReportMapper inspectionReportMapper;
    private final PrepItemMapper prepItemMapper;
    private final TestDriveMapper testDriveMapper;
    private final InventoryDailySnapshotMapper inventoryDailySnapshotMapper;
    private final DatasourceSyncLogMapper datasourceSyncLogMapper;
    private final FilterViewMapper filterViewMapper;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private DashboardFilter resolveEffectiveFilter(DashboardFilter filter) {
        if (filter == null) {
            filter = new DashboardFilter();
        }
        if (filter.hasViewId()) {
            FilterView savedView = filterViewMapper.selectByViewId(filter.getViewId());
            if (savedView != null && savedView.getFiltersJson() != null) {
                DashboardFilter savedFilter = savedView.getFiltersJson();
                savedFilter.setViewId(filter.getViewId());
                return savedFilter;
            }
        }
        return filter;
    }

    private String buildCacheKey(String prefix, DashboardFilter filter, String shareToken) {
        try {
            String filterStr = objectMapper.writeValueAsString(filter);
            String md5 = md5Hex(filterStr + (shareToken != null ? shareToken : ""));
            return "dashboard:" + prefix + ":" + md5;
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize filter for cache key", e);
            return "dashboard:" + prefix + ":" + System.currentTimeMillis();
        }
    }

    private String md5Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    @SuppressWarnings("unchecked")
    private <T> T getFromCache(String key) {
        try {
            return (T) redisTemplate.opsForValue().get(key);
        } catch (Exception e) {
            log.warn("Failed to read from cache: {}", key, e);
            return null;
        }
    }

    private void putToCache(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Failed to write to cache: {}", key, e);
        }
    }

    @Override
    public DashboardOverview getOverview(DashboardFilter filter, String shareToken) {
        DashboardFilter effectiveFilter = resolveEffectiveFilter(filter);
        String cacheKey = buildCacheKey("overview", effectiveFilter, shareToken);
        DashboardOverview cached = getFromCache(cacheKey);
        if (cached != null) {
            return cached;
        }

        DashboardOverview.DataSources dataSources = buildDataSources();

        DashboardOverview.Summary summary = buildSummary(effectiveFilter);

        DashboardOverview.InventoryTurnoverMetrics turnover = buildTurnover(effectiveFilter);

        String lastRefreshTime = LocalDateTime.now().format(DATETIME_FORMATTER);

        DashboardOverview result = DashboardOverview.builder()
                .lastRefreshTime(lastRefreshTime)
                .dataSources(dataSources)
                .summary(summary)
                .turnover(turnover)
                .build();

        putToCache(cacheKey, result);
        return result;
    }

    private DashboardOverview.DataSources buildDataSources() {
        List<DatasourceSyncLog> latestLogs = datasourceSyncLogMapper.selectLatestPerSource();
        Map<String, DatasourceSyncLog> logMap = latestLogs.stream()
                .collect(Collectors.toMap(DatasourceSyncLog::getSourceName, log -> log, (a, b) -> a));

        DashboardOverview.DataSourceStatus inspection = toDataSourceStatus(logMap.get("inspection"));
        DashboardOverview.DataSourceStatus finance = toDataSourceStatus(logMap.get("finance"));
        DashboardOverview.DataSourceStatus inventory = toDataSourceStatus(logMap.get("inventory"));

        return DashboardOverview.DataSources.builder()
                .inspection(inspection)
                .finance(finance)
                .inventory(inventory)
                .build();
    }

    private DashboardOverview.DataSourceStatus toDataSourceStatus(DatasourceSyncLog log) {
        if (log == null) {
            return DashboardOverview.DataSourceStatus.builder()
                    .status("unknown")
                    .lastSync("从未同步")
                    .build();
        }
        String status = "delayed".equals(log.getStatus()) ? "delayed" : "online";
        String lastSync = formatRelativeTime(log.getSyncTime());
        return DashboardOverview.DataSourceStatus.builder()
                .status(status)
                .lastSync(lastSync)
                .build();
    }

    private String formatRelativeTime(LocalDateTime time) {
        if (time == null) {
            return "从未同步";
        }
        long minutes = Duration.between(time, LocalDateTime.now()).toMinutes();
        if (minutes < 1) return "刚刚";
        if (minutes < 60) return minutes + " 分钟前";
        long hours = minutes / 60;
        if (hours < 24) return hours + " 小时前";
        long days = hours / 24;
        return days + " 天前";
    }

    private DashboardOverview.Summary buildSummary(DashboardFilter filter) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekAgo = now.minusDays(7);
        LocalDateTime monthAgo = now.minusDays(30);
        LocalDateTime twoWeeksAgo = now.minusDays(14);
        LocalDateTime twoMonthsAgo = now.minusDays(60);

        Integer totalListed = vehicleSourceMapper.countCurrentlyListedByFilter(filter);

        Integer currentWeek = vehicleSourceMapper.countListedByDateRange(weekAgo, now, filter.getStoreIds());
        Integer prevWeek = vehicleSourceMapper.countListedByDateRange(twoWeeksAgo, weekAgo, filter.getStoreIds());
        Double weekOverWeek = calcPercentageChange(currentWeek, prevWeek);

        Integer currentMonth = vehicleSourceMapper.countListedByDateRange(monthAgo, now, filter.getStoreIds());
        Integer prevMonth = vehicleSourceMapper.countListedByDateRange(twoMonthsAgo, monthAgo, filter.getStoreIds());
        Double monthOverMonth = calcPercentageChange(currentMonth, prevMonth);

        Double inspectionPassRate = inspectionReportMapper.countPassRateByFilter(filter);
        if (inspectionPassRate == null) inspectionPassRate = 0.0;

        Double avgPrepDays = prepItemMapper.calcAvgPrepDaysByFilter(filter);
        if (avgPrepDays == null) avgPrepDays = 0.0;

        Integer abnormalTestDrives = testDriveMapper.countAbnormalByFilter(filter);

        return DashboardOverview.Summary.builder()
                .totalListed(totalListed != null ? totalListed : 0)
                .weekOverWeek(roundTo1(weekOverWeek))
                .monthOverMonth(roundTo1(monthOverMonth))
                .inspectionPassRate(roundTo1(inspectionPassRate))
                .avgPrepDays(roundTo1(avgPrepDays))
                .abnormalTestDrives(abnormalTestDrives != null ? abnormalTestDrives : 0)
                .build();
    }

    private DashboardOverview.InventoryTurnoverMetrics buildTurnover(DashboardFilter filter) {
        Double avgTurnoverDays = inventoryDailySnapshotMapper.avgTurnoverDaysByFilter(filter);
        if (avgTurnoverDays == null) avgTurnoverDays = 0.0;

        Double turnoverRate = calcTurnoverRate(filter);

        Integer fastMovingCount = vehicleSourceMapper.countFastMoving(filter);
        Integer slowMovingCount = vehicleSourceMapper.countSlowMoving(filter);

        return DashboardOverview.InventoryTurnoverMetrics.builder()
                .avgTurnoverDays(roundTo1(avgTurnoverDays))
                .turnoverRate(roundTo1(turnoverRate))
                .fastMovingCount(fastMovingCount != null ? fastMovingCount : 0)
                .slowMovingCount(slowMovingCount != null ? slowMovingCount : 0)
                .definition(DEFINITION)
                .build();
    }

    private Double calcTurnoverRate(DashboardFilter filter) {
        LocalDate startDate = filter.hasDateRange() ? LocalDate.parse(filter.getStartDate()) : LocalDate.now().minusDays(30);
        LocalDate endDate = filter.hasDateRange() ? LocalDate.parse(filter.getEndDate()) : LocalDate.now();

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        Integer soldCount = vehicleSourceMapper.countSoldByDateRange(start, end, filter.getStoreIds());
        if (soldCount == null || soldCount == 0) return 0.0;

        long days = Duration.between(start, end).toDays() + 1;

        Integer listedNow = vehicleSourceMapper.countCurrentlyListedByFilter(filter);
        double avgInventory = (listedNow != null ? listedNow : 0);

        if (avgInventory == 0) return 0.0;

        BigDecimal sold = new BigDecimal(soldCount);
        BigDecimal avgInv = new BigDecimal(avgInventory);
        BigDecimal daysBig = new BigDecimal(days);
        BigDecimal monthlyDays = new BigDecimal(30);

        return sold.divide(avgInv, 4, RoundingMode.HALF_UP)
                .multiply(monthlyDays)
                .divide(daysBig, 2, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private Double calcPercentageChange(Integer current, Integer previous) {
        if (previous == null || previous == 0) return 0.0;
        int cur = current != null ? current : 0;
        return ((cur - previous) * 100.0) / previous;
    }

    private Double roundTo1(Double value) {
        if (value == null) return 0.0;
        return BigDecimal.valueOf(value).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    @Override
    public List<VehicleArchiveTrend> getVehicleTrend(DashboardFilter filter, String shareToken) {
        DashboardFilter effectiveFilter = resolveEffectiveFilter(filter);
        String cacheKey = buildCacheKey("vehicleTrend", effectiveFilter, shareToken);
        List<VehicleArchiveTrend> cached = getFromCache(cacheKey);
        if (cached != null) {
            return cached;
        }

        LocalDate startDate = effectiveFilter.hasDateRange() ? LocalDate.parse(effectiveFilter.getStartDate()) : LocalDate.now().minusDays(29);
        LocalDate endDate = effectiveFilter.hasDateRange() ? LocalDate.parse(effectiveFilter.getEndDate()) : LocalDate.now();

        List<VehicleArchiveTrend> result = new ArrayList<>();
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            LocalDateTime dayStart = date.atStartOfDay();
            LocalDateTime dayEnd = date.atTime(LocalTime.MAX);

            Integer listed = vehicleSourceMapper.countListedByDateRange(dayStart, dayEnd, effectiveFilter.getStoreIds());
            Integer delisted = vehicleSourceMapper.countDelistedByDateRange(dayStart, dayEnd, effectiveFilter.getStoreIds());

            int l = listed != null ? listed : 0;
            int d = delisted != null ? delisted : 0;

            result.add(VehicleArchiveTrend.builder()
                    .period(date.format(DATE_FORMATTER))
                    .listed(l)
                    .delisted(d)
                    .netChange(l - d)
                    .build());
        }

        result.sort(Comparator.comparing(VehicleArchiveTrend::getPeriod));
        putToCache(cacheKey, result);
        return result;
    }

    @Override
    public InspectionReportComposition getInspectionReport(DashboardFilter filter, String shareToken) {
        DashboardFilter effectiveFilter = resolveEffectiveFilter(filter);
        String cacheKey = buildCacheKey("inspectionReport", effectiveFilter, shareToken);
        InspectionReportComposition cached = getFromCache(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<InspectionReport> allReports = inspectionReportMapper.selectCategoryGroupByFilter(effectiveFilter);

        Map<String, Integer> categoryDistribution = new LinkedHashMap<>();
        for (InspectionReport report : allReports) {
            String cat = report.getCategory() != null ? report.getCategory() : "unknown";
            categoryDistribution.merge(cat, 1, Integer::sum);
        }

        List<Map<String, Object>> categoryDetails = new ArrayList<>();
        Map<String, List<InspectionReport>> groupedByCategory = allReports.stream()
                .collect(Collectors.groupingBy(r -> r.getCategory() != null ? r.getCategory() : "unknown"));

        for (Map.Entry<String, List<InspectionReport>> entry : groupedByCategory.entrySet()) {
            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("category", entry.getKey());
            detail.put("count", entry.getValue().size());
            List<Map<String, Object>> vehicles = entry.getValue().stream()
                    .limit(10)
                    .map(r -> {
                        Map<String, Object> v = new LinkedHashMap<>();
                        v.put("vehicleId", r.getVehicleId());
                        v.put("storeId", r.getStoreId());
                        v.put("inspector", r.getInspector());
                        v.put("inspectionDate", r.getInspectionDate() != null ? r.getInspectionDate().format(DATETIME_FORMATTER) : null);
                        v.put("overallScore", r.getOverallScore());
                        v.put("defectCount", r.getDefectCount());
                        return v;
                    })
                    .collect(Collectors.toList());
            detail.put("vehicles", vehicles);
            categoryDetails.add(detail);
        }

        Double passRate = inspectionReportMapper.countPassRateByFilter(effectiveFilter);

        InspectionReportComposition result = InspectionReportComposition.builder()
                .totalReports(allReports.size())
                .categoryDistribution(categoryDistribution)
                .categoryDetails(categoryDetails)
                .passRate(roundTo1(passRate))
                .build();

        putToCache(cacheKey, result);
        return result;
    }

    @Override
    public PrepListDetail getPrepList(DashboardFilter filter, String shareToken) {
        DashboardFilter effectiveFilter = resolveEffectiveFilter(filter);
        String cacheKey = buildCacheKey("prepList", effectiveFilter, shareToken);
        PrepListDetail cached = getFromCache(cacheKey);
        if (cached != null) {
            return cached;
        }

        Map<String, Integer> statusDistribution = new LinkedHashMap<>();
        statusDistribution.put("notStarted", safeInt(prepItemMapper.countByStatusAndFilter("not_started", effectiveFilter)));
        statusDistribution.put("inProgress", safeInt(prepItemMapper.countByStatusAndFilter("in_progress", effectiveFilter)));
        statusDistribution.put("completed", safeInt(prepItemMapper.countByStatusAndFilter("completed", effectiveFilter)));
        statusDistribution.put("overdue", safeInt(prepItemMapper.countOverdue(effectiveFilter.getStoreIds())));

        Double avgPrepDays = prepItemMapper.calcAvgPrepDaysByFilter(effectiveFilter);

        List<PrepItem> overduePrepItems = prepItemMapper.selectOverdueItemsTopN(effectiveFilter, 8);
        List<PrepOverdueItem> overdueItems = overduePrepItems.stream()
                .map(item -> {
                    VehicleSource vs = vehicleSourceMapper.selectByVehicleId(item.getVehicleId());
                    String brand = vs != null ? vs.getBrand() : "";
                    String model = vs != null ? vs.getModel() : "";
                    String financeApproval = vs != null ? mapFinanceStatus(vs.getFinanceStatus()) : "未提交";
                    return PrepOverdueItem.builder()
                            .vehicleId(item.getVehicleId())
                            .brand(brand)
                            .model(model)
                            .financeApproval(financeApproval)
                            .status(mapPrepStatus(item.getStatus()))
                            .prepDays(item.getActualDays() != null ? item.getActualDays() : 0)
                            .expectedDays(item.getExpectedDays() != null ? item.getExpectedDays() : 0)
                            .build();
                })
                .collect(Collectors.toList());

        PrepListDetail result = PrepListDetail.builder()
                .statusDistribution(statusDistribution)
                .avgPrepDays(roundTo1(avgPrepDays))
                .overdueItems(overdueItems)
                .build();

        putToCache(cacheKey, result);
        return result;
    }

    private String mapFinanceStatus(String status) {
        if (status == null) return "未提交";
        switch (status) {
            case "approved": return "已审批";
            case "pending": return "审批中";
            default: return "未提交";
        }
    }

    private String mapPrepStatus(String status) {
        if (status == null) return "not_started";
        switch (status) {
            case "in_progress": return "in_progress";
            case "completed": return "completed";
            default: return "not_started";
        }
    }

    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }

    @Override
    public TestDriveAnomaly getTestDriveAnomaly(DashboardFilter filter, String shareToken) {
        DashboardFilter effectiveFilter = resolveEffectiveFilter(filter);
        String cacheKey = buildCacheKey("testDriveAnomaly", effectiveFilter, shareToken);
        TestDriveAnomaly cached = getFromCache(cacheKey);
        if (cached != null) {
            return cached;
        }

        Integer totalDrives = testDriveMapper.countByFilter(effectiveFilter);
        Integer abnormalCount = testDriveMapper.countAbnormalByFilter(effectiveFilter);

        List<TestDrive> allDrives = testDriveMapper.selectDailyDistributionByFilter(effectiveFilter);

        Map<LocalDate, int[]> dailyMap = new TreeMap<>();
        for (TestDrive td : allDrives) {
            LocalDate date = td.getStartTime() != null ? td.getStartTime().toLocalDate() : LocalDate.now();
            dailyMap.computeIfAbsent(date, k -> new int[2]);
            if (td.getIsAbnormal() != null && td.getIsAbnormal() == 1) {
                dailyMap.get(date)[1]++;
            } else {
                dailyMap.get(date)[0]++;
            }
        }

        List<DailyDriveDistribution> dailyDistribution = dailyMap.entrySet().stream()
                .map(e -> DailyDriveDistribution.builder()
                        .date(e.getKey().format(DATE_FORMATTER))
                        .normalCount(e.getValue()[0])
                        .abnormalCount(e.getValue()[1])
                        .build())
                .collect(Collectors.toList());

        List<TestDrive> abnormalList = testDriveMapper.selectAbnormalTopN(effectiveFilter, 10);
        List<AnomalyItem> anomalies = abnormalList.stream()
                .map(td -> AnomalyItem.builder()
                        .vehicleId(td.getVehicleId())
                        .date(td.getStartTime() != null ? td.getStartTime().toLocalDate().format(DATE_FORMATTER) : "")
                        .type(td.getAnomalyType())
                        .description(ANOMALY_TYPE_DESC.getOrDefault(td.getAnomalyType(), td.getAnomalyDesc() != null ? td.getAnomalyDesc() : ""))
                        .severity(ANOMALY_SEVERITY_DESC.getOrDefault(td.getAnomalySeverity(), td.getAnomalySeverity() != null ? td.getAnomalySeverity() : "low"))
                        .build())
                .collect(Collectors.toList());

        TestDriveAnomaly result = TestDriveAnomaly.builder()
                .totalDrives(totalDrives != null ? totalDrives : 0)
                .abnormalCount(abnormalCount != null ? abnormalCount : 0)
                .dailyDistribution(dailyDistribution)
                .anomalies(anomalies)
                .build();

        putToCache(cacheKey, result);
        return result;
    }
}
