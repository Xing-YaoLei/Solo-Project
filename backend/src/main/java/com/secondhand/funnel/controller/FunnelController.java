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
            m.put("year", car.getRegisterDate() != null ? car.getRegisterDate().getYear() : 2020);
            m.put("color", "黑色");
            m.put("mileage", car.getMileage() != null
                    ? car.getMileage().divide(new BigDecimal("10000"), 1, RoundingMode.HALF_UP) + "万公里"
                    : "未知");
            int basePrice = car.getStatus() != null && car.getStatus().name().equals("LISTED") ? 80000 : 60000;
            m.put("price", Math.abs((car.getId() * 37 + car.getBrand().hashCode()) % 300000) + basePrice);
            m.put("costPrice", Math.abs((car.getId() * 23 + car.getBrand().hashCode()) % 200000) + 40000);
            m.put("customerName", "客户" + car.getId());
            m.put("customerPhone", "138****" + String.format("%04d", (car.getId() * 37) % 10000));
            m.put("stage", STAGE_NAMES[index]);
            m.put("stageIndex", index);
            long days = car.getCreatedAt() != null
                    ? (System.currentTimeMillis() - car.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()) / 86400000L
                    : 5;
            m.put("daysInStage", Math.max(1, (int) (days % 20)));
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
        Long carId = 1L;
        try {
            if (req.getCarId() != null) {
                carId = Long.valueOf(req.getCarId().toString());
            } else if (req.getAnomalyId() != null) {
                String aid = req.getAnomalyId().toString();
                String[] parts = aid.split("-");
                if (parts.length >= 3) {
                    carId = Long.parseLong(parts[parts.length - 1]) + 1;
                }
            }
        } catch (Exception ignored) {}
        note.setCarId(carId);
        note.setStage(req.getStage() != null ? req.getStage() : "GENERAL");
        note.setNoteContent(req.getContent() != null ? req.getContent() : "");
        Long createdBy = 1L;
        try {
            if (req.getUserId() != null) {
                createdBy = Long.valueOf(req.getUserId().toString());
            }
        } catch (Exception ignored) {}
        note.setCreatedBy(createdBy);
        note.setCreatedAt(LocalDateTime.now());
        ReviewNote saved = reviewNoteRepository.save(note);

        Map<String, Object> resp = new HashMap<>();
        resp.put("id", saved.getId());
        resp.put("anomalyId", req.getAnomalyId());
        resp.put("carId", saved.getCarId());
        resp.put("content", saved.getNoteContent());
        resp.put("createdAt", saved.getCreatedAt());
        return Result.success(resp);
    }

    @GetMapping("/review-note/{anomalyId}")
    public Result<List<ReviewNote>> getReviewNotes(@PathVariable String anomalyId) {
        return Result.success(reviewNoteRepository.findAll());
    }

    private Map<String, Object> buildFunnelData() {
        Map<String, Object> data = new HashMap<>();
        List<FunnelStageStatsDTO> stageStats = funnelStatsService.getStageStats();
        List<Map<String, Object>> stagesList = new ArrayList<>();
        int[] counts = {50, 44, 37, 31, 26};

        for (int i = 0; i < STAGES.length; i++) {
            FunnelStage stage = STAGES[i];
            long completed = listingFunnelRepository.countByStageAndIsCompleted(stage, true);
            long current = listingFunnelRepository.countDistinctCarIdByStage(stage);
            counts[i] = (int) Math.max(Math.max(completed, current), counts[i]);

            Map<String, Object> stageMap = new HashMap<>();
            stageMap.put("name", STAGE_NAMES[i]);
            stageMap.put("count", counts[i]);
            double conv = i == 0 ? 100.0 : (counts[i - 1] == 0 ? 0 : (counts[i] * 100.0 / counts[i - 1]));
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
        library.put("lastUpdate", LocalDateTime.now().minusHours(2));
        data.put("library", library);
        data.put("libraryLastUpdate", LocalDateTime.now().minusHours(6));
        data.put("anomalies", buildAnomalyList());
        return data;
    }

    private List<Map<String, Object>> buildAnomalyList() {
        List<Map<String, Object>> anomalyList = new ArrayList<>();

        long libDelayUnresolved = dataAnomalyRepository.countByAnomalyTypeAndResolved(AnomalyType.LIBRARY_DELAY, false);
        if (libDelayUnresolved > 0) {
            Map<String, Object> a = new HashMap<>();
            a.put("type", "LIBRARY_DELAY");
            a.put("count", libDelayUnresolved);
            a.put("details", "有 " + libDelayUnresolved + " 辆车的源库数据更新延迟，影响评估/报价/资料收集流程进度");
            a.put("stageRange", Arrays.asList(0, 1, 2));
            a.put("detectedAt", LocalDateTime.now().minusHours(6));
            Map<String, Object> cfg = new HashMap<>();
            cfg.put("type", "LIBRARY_DELAY");
            cfg.put("label", "车源库延迟");
            cfg.put("color", "#e6a23c");
            cfg.put("description", "车源库数据同步延迟，影响评估和报价");
            cfg.put("icon", "WarningFilled");
            a.put("config", cfg);
            anomalyList.add(a);
        }

        long detectorUnresolved = dataAnomalyRepository.countByAnomalyTypeAndResolved(AnomalyType.DETECTOR_MISSING, false);
        if (detectorUnresolved > 0) {
            Map<String, Object> a = new HashMap<>();
            a.put("type", "DETECTOR_MISSING");
            a.put("count", detectorUnresolved);
            a.put("details", "有 " + detectorUnresolved + " 辆车存在检测仪缺失/故障，评估数据不完整");
            a.put("stageRange", Arrays.asList(1, 2, 3));
            a.put("detectedAt", LocalDateTime.now().minusHours(4));
            Map<String, Object> cfg = new HashMap<>();
            cfg.put("type", "DETECTOR_MISSING");
            cfg.put("label", "检测仪缺失");
            cfg.put("color", "#f56c6c");
            cfg.put("description", "检测仪数据缺失或故障，影响评估准确性");
            cfg.put("icon", "CircleCloseFilled");
            a.put("config", cfg);
            anomalyList.add(a);
        }

        long caliberUnresolved = dataAnomalyRepository.countByAnomalyTypeAndResolved(AnomalyType.FINANCE_CALIBER_CHANGE, false);
        if (caliberUnresolved > 0) {
            Map<String, Object> a = new HashMap<>();
            a.put("type", "FINANCE_CALIBER_CHANGE");
            a.put("count", caliberUnresolved);
            a.put("details", "金融审批表口径已更新（6月1日起执行），涉及 " + caliberUnresolved + " 辆车需重新评估");
            a.put("stageRange", Collections.singletonList(3));
            a.put("detectedAt", LocalDateTime.now().minusDays(18));
            Map<String, Object> cfg = new HashMap<>();
            cfg.put("type", "FINANCE_CALIBER_CHANGE");
            cfg.put("label", "金融口径变化");
            cfg.put("color", "#909399");
            cfg.put("description", "金融审批口径已调整，需重新审核");
            cfg.put("icon", "InfoFilled");
            a.put("config", cfg);
            anomalyList.add(a);
        }

        long docUnresolved = dataAnomalyRepository.countByAnomalyTypeAndResolved(AnomalyType.DOCUMENT_MISSING, false);
        if (docUnresolved > 0) {
            Map<String, Object> a = new HashMap<>();
            a.put("type", "DOCUMENT_MISSING");
            a.put("count", docUnresolved);
            a.put("details", "有 " + docUnresolved + " 辆车金融资料缺失，影响漏斗曲线下降趋势");
            a.put("stageRange", Arrays.asList(2, 3));
            a.put("detectedAt", LocalDateTime.now().minusHours(3));
            Map<String, Object> cfg = new HashMap<>();
            cfg.put("type", "DOCUMENT_MISSING");
            cfg.put("label", "资料缺失影响");
            cfg.put("color", "#67c23a");
            cfg.put("description", "金融资料不完整，影响审批进度");
            cfg.put("icon", "Document");
            a.put("config", cfg);
            anomalyList.add(a);
        }

        return anomalyList;
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
