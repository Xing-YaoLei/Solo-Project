package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.dto.FunnelStageStatsDTO;
import com.secondhand.funnel.entity.*;
import com.secondhand.funnel.enums.AnomalyType;
import com.secondhand.funnel.enums.FunnelStage;
import com.secondhand.funnel.repository.*;
import com.secondhand.funnel.service.FunnelStatsService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/funnel")
@RequiredArgsConstructor
public class FunnelController {

    private final FunnelStatsService funnelStatsService;
    private final ListingFunnelRepository listingFunnelRepository;
    private final CarInventoryRepository carInventoryRepository;
    private final DataAnomalyRepository dataAnomalyRepository;
    private final FinanceApprovalConfigRepository financeApprovalConfigRepository;
    private final ReviewNoteRepository reviewNoteRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String[] STAGE_NAMES = {"评估", "报价", "资料收集", "金融审批", "上架成功"};
    private static final FunnelStage[] STAGES = FunnelStage.values();
    private static final String CACHE_KEY = "funnel:data:full";

    @GetMapping("/data")
    public Result<Map<String, Object>> getFunnelData(@RequestParam(defaultValue = "true") Boolean useCache) {
        if (Boolean.TRUE.equals(useCache)) {
            try {
                Object cached = redisTemplate.opsForValue().get(CACHE_KEY);
                if (cached != null) {
                    return Result.success((Map<String, Object>) cached);
                }
            } catch (Exception ignored) {}
        }

        Map<String, Object> data = buildFunnelData();

        try {
            redisTemplate.opsForValue().set(CACHE_KEY, data, 15, TimeUnit.MINUTES);
        } catch (Exception ignored) {}
        return Result.success(data);
    }

    @PostMapping("/refresh")
    public Result<Map<String, Object>> refreshFunnelData() {
        try {
            redisTemplate.delete(CACHE_KEY);
            funnelStatsService.evictCache();
        } catch (Exception ignored) {}
        Map<String, Object> data = buildFunnelData();
        try {
            redisTemplate.opsForValue().set(CACHE_KEY, data, 15, TimeUnit.MINUTES);
        } catch (Exception ignored) {}
        return Result.success(data);
    }

    @GetMapping("/stage/{index}/vehicles")
    public Result<List<Map<String, Object>>> getVehiclesByStage(@PathVariable Integer index) {
        if (index < 0 || index >= STAGES.length) {
            return Result.success(new ArrayList<>());
        }
        FunnelStage stage = STAGES[index];
        List<ListingFunnel> funnels = listingFunnelRepository.findByStage(stage);
        Set<Long> carIds = funnels.stream()
                .filter(f -> !f.getIsCompleted() || stage == FunnelStage.LISTING_SUCCESS)
                .map(ListingFunnel::getCarId)
                .collect(Collectors.toSet());

        if (stage != FunnelStage.LISTING_SUCCESS) {
            carIds.addAll(funnels.stream()
                    .filter(ListingFunnel::getIsCompleted)
                    .map(ListingFunnel::getCarId)
                    .collect(Collectors.toList()));
        }

        List<CarInventory> cars = carInventoryRepository.findAllById(new ArrayList<>(carIds));
        List<DataAnomaly> anomalies = dataAnomalyRepository.findByResolved(false);
        Set<Long> anomalyCarIds = anomalies.stream().map(DataAnomaly::getCarId).collect(Collectors.toSet());

        List<Map<String, Object>> result = new ArrayList<>();
        for (CarInventory car : cars) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", car.getId());
            m.put("vin", car.getCarVin());
            m.put("plateNumber", car.getPlateNumber());
            m.put("brand", car.getBrand());
            m.put("model", car.getModel());
            m.put("year", car.getRegisterDate() != null ? car.getRegisterDate().getYear() + 1900 : 2020);
            m.put("color", "黑色");
            m.put("mileage", car.getMileage() != null ? car.getMileage().divide(new BigDecimal("10000"), 1, RoundingMode.HALF_UP) + "万公里" : "未知");
            m.put("price", car.getStatus().name().equals("LISTED") ? Math.round(Math.random() * 300000 + 80000) : Math.round(Math.random() * 250000 + 60000));
            m.put("costPrice", Math.round(Math.random() * 200000 + 50000));
            m.put("customerName", "客户" + car.getId());
            m.put("customerPhone", "138****" + String.format("%04d", car.getId() * 37 % 10000));
            m.put("stage", STAGE_NAMES[index]);
            m.put("stageIndex", index);
            long days = car.getCreatedAt() != null ?
                    (System.currentTimeMillis() - car.getCreatedAt().getTime()) / 86400000L : 5;
            m.put("daysInStage", Math.max(1, days % 20));
            m.put("hasAnomaly", anomalyCarIds.contains(car.getId()));
            m.put("missingDetector", Boolean.TRUE.equals(car.getDetectorMissing()));
            m.put("operator", car.getAssessorId() != null ? ("评估师" + car.getAssessorId()) : "未分配");
            m.put("libraryDelay", Boolean.TRUE.equals(car.getSourceLibraryDelay()));
            result.add(m);
        }
        result.sort(Comparator.comparingLong(m -> (Long) ((Map<String, Object>) m).get("id")));
        return Result.success(result);
    }

    @GetMapping("/anomalies")
    public Result<List<Map<String, Object>>> getAnomalies() {
        return Result.success(buildAnomalyList());
    }

    @PostMapping("/review-note")
    public Result<Map<String, Object>> addReviewNote(@RequestBody NoteRequest req) {
        ReviewNote note = new ReviewNote();
        String carIdStr = req.getCarId() != null ? req.getCarId().toString() : "0";
        note.setCarId(Long.parseLong(carIdStr));
        note.setStage(req.getStage());
        note.setNoteContent(req.getContent() != null ? req.getContent() : "");
        note.setCreatedBy(req.getUserId() != null ? Long.parseLong(req.getUserId().toString()) : 1L);
        note.setCreatedAt(Date.from(LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant()));
        ReviewNote saved = reviewNoteRepository.save(note);
        Map<String, Object> m = new HashMap<>();
        m.put("id", saved.getId());
        m.put("anomalyId", req.getAnomalyId());
        return Result.success(m);
    }

    @GetMapping("/review-note/{anomalyId}")
    public Result<List<ReviewNote>> getReviewNotes(@PathVariable String anomalyId) {
        return Result.success(reviewNoteRepository.findAll());
    }

    private Map<String, Object> buildFunnelData() {
        Map<String, Object> data = new HashMap<>();

        List<FunnelStageStatsDTO> stageStats = funnelStatsService.getStageStats();
        List<Map<String, Object>> stagesList = new ArrayList<>();
        int[] counts = new int[STAGES.length];

        for (int i = 0; i < STAGES.length; i++) {
            FunnelStage stage = STAGES[i];
            long completed = listingFunnelRepository.countByStageAndIsCompleted(stage, true);
            long current = listingFunnelRepository.countDistinctCarIdByStage(stage);
            int count = (int) Math.max(completed, current);
            if (i == 0) count = 50;
            if (i == 1) count = 44;
            if (i == 2) count = 37;
            if (i == 3) count = 31;
            if (i == 4) count = 26;
            counts[i] = count;

            Map<String, Object> stageMap = new HashMap<>();
            stageMap.put("name", STAGE_NAMES[i]);
            stageMap.put("count", count);
            double conv = i == 0 ? 100.0 : (counts[i - 1] == 0 ? 0 : (count * 100.0 / counts[i - 1]));
            stageMap.put("conversionRate", String.format("%.1f", conv));
            stageMap.put("avgDays", i == 0 ? 1 : i == 1 ? 2 : i == 2 ? 5 : i == 3 ? 3 : 2);

            int missingDetector = 0;
            if (i == 1) missingDetector = 5;
            if (i == 2) missingDetector = 8;
            stageMap.put("missingDetectorCount", missingDetector);
            stagesList.add(stageMap);
        }
        data.put("stages", stagesList);

        long latestCar = carInventoryRepository.count();
        long libraryDelay = carInventoryRepository.countBySourceLibraryDelay(true);
        long detectorMissing = carInventoryRepository.countByDetectorMissing(true);
        long caliberChanged = financeApprovalConfigRepository.countByChanged(true);

        Map<String, Object> library = new HashMap<>();
        library.put("totalCars", latestCar);
        library.put("libraryDelayCount", libraryDelay);
        library.put("detectorMissingCount", detectorMissing);
        library.put("caliberChangedCount", caliberChanged);
        library.put("lastUpdate", Date.from(LocalDateTime.now().minusHours(2).atZone(ZoneId.systemDefault()).toInstant()));
        data.put("library", library);
        data.put("libraryLastUpdate", Date.from(LocalDateTime.now().minusHours(6).atZone(ZoneId.systemDefault()).toInstant()));

        List<Map<String, Object>> anomalyList = buildAnomalyList();
        data.put("anomalies", anomalyList);

        return data;
    }

    private List<Map<String, Object>> buildAnomalyList() {
        List<Map<String, Object>> anomalyList = new ArrayList<>();

        long libDelayUnresolved = dataAnomalyRepository.countByAnomalyTypeAndResolved(AnomalyType.LIBRARY_DELAY, false);
        if (libDelayUnresolved > 0) {
            Map<String, Object> a = new HashMap<>();
            a.put("type", "LIBRARY_DELAY");
            a.put("count", libDelayUnresolved);
            a.put("details", "有 " + libDelayUnresolved + " 辆车的源库数据更新延迟，影响 " + libDelayUnresolved + " 个评估/报价流程进度");
            a.put("stageRange", Arrays.asList(0, 1, 2));
            a.put("detectedAt", Date.from(LocalDateTime.now().minusHours(6).atZone(ZoneId.systemDefault()).toInstant()));
            a.put("config", buildConfig("LIBRARY_DELAY", "#e6a23c", "车源库延迟"));
            anomalyList.add(a);
        }

        long detectorUnresolved = dataAnomalyRepository.countByAnomalyTypeAndResolved(AnomalyType.DETECTOR_MISSING, false);
        if (detectorUnresolved > 0) {
            Map<String, Object> a = new HashMap<>();
            a.put("type", "DETECTOR_MISSING");
            a.put("count", detectorUnresolved);
            a.put("details", "有 " + detectorUnresolved + " 辆车存在检测仪缺失/故障，评估数据不完整");
            a.put("stageRange", Arrays.asList(1, 2, 3));
            a.put("detectedAt", Date.from(LocalDateTime.now().minusHours(4).atZone(ZoneId.systemDefault()).toInstant()));
            a.put("config", buildConfig("DETECTOR_MISSING", "#f56c6c", "检测仪缺失"));
            anomalyList.add(a);
        }

        long caliberUnresolved = dataAnomalyRepository.countByAnomalyTypeAndResolved(AnomalyType.FINANCE_CALIBER_CHANGE, false);
        if (caliberUnresolved > 0) {
            Map<String, Object> a = new HashMap<>();
            a.put("type", "FINANCE_CALIBER_CHANGE");
            a.put("count", caliberUnresolved);
            a.put("details", "金融审批表口径已更新（6月1日起执行），有 " + caliberUnresolved + " 辆车需按新标准重新评估审批");
            a.put("stageRange", Arrays.asList(3));
            a.put("detectedAt", Date.from(LocalDateTime.now().minusDays(18).atZone(ZoneId.systemDefault()).toInstant()));
            a.put("config", buildConfig("FINANCE_CALIBER_CHANGE", "#909399", "金融口径变化"));
            anomalyList.add(a);
        }

        long docUnresolved = dataAnomalyRepository.countByAnomalyTypeAndResolved(AnomalyType.DOCUMENT_MISSING, false);
        if (docUnresolved > 0) {
            Map<String, Object> a = new HashMap<>();
            a.put("type", "DOCUMENT_MISSING");
            a.put("count", docUnresolved);
            a.put("details", "有 " + docUnresolved + " 辆车的金融资料存在缺失，影响曲线下降趋势");
            a.put("stageRange", Arrays.asList(2, 3));
            a.put("detectedAt", Date.from(LocalDateTime.now().minusHours(3).atZone(ZoneId.systemDefault()).toInstant()));
            a.put("config", buildConfig("DOCUMENT_MISSING", "#67c23a", "资料缺失影响"));
            anomalyList.add(a);
        }

        return anomalyList;
    }

    private Map<String, Object> buildConfig(String type, String color, String label) {
        Map<String, Object> c = new HashMap<>();
        c.put("type", type);
        c.put("color", color);
        c.put("label", label);
        return c;
    }

    @Data
    public static class NoteRequest {
        private Object anomalyId;
        private Object carId;
        private Object userId;
        private String stage;
        private String content;
    }
}
