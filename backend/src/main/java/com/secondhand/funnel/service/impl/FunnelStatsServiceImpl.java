package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.dto.FunnelStatsDTO;
import com.secondhand.funnel.dto.FunnelStageStatsDTO;
import com.secondhand.funnel.entity.DataAnomaly;
import com.secondhand.funnel.entity.InventoryTurnover;
import com.secondhand.funnel.entity.ListingFunnel;
import com.secondhand.funnel.enums.AnomalyType;
import com.secondhand.funnel.enums.CarStatus;
import com.secondhand.funnel.enums.FunnelStage;
import com.secondhand.funnel.repository.CarInventoryRepository;
import com.secondhand.funnel.repository.DataAnomalyRepository;
import com.secondhand.funnel.repository.InventoryTurnoverRepository;
import com.secondhand.funnel.repository.ListingFunnelRepository;
import com.secondhand.funnel.service.FunnelStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class FunnelStatsServiceImpl implements FunnelStatsService {

    private static final String CACHE_KEY_OVERALL = "funnel:stats:overall";
    private static final String CACHE_KEY_STAGES = "funnel:stats:stages";
    private static final long CACHE_TTL_MINUTES = 30;

    private final CarInventoryRepository carInventoryRepository;
    private final ListingFunnelRepository listingFunnelRepository;
    private final DataAnomalyRepository dataAnomalyRepository;
    private final InventoryTurnoverRepository inventoryTurnoverRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public FunnelStatsDTO getOverallStats() {
        FunnelStatsDTO dto = new FunnelStatsDTO();

        dto.setTotalCars(carInventoryRepository.count());
        dto.setListedCars(carInventoryRepository.countByStatus(CarStatus.LISTED));
        dto.setSoldCars(carInventoryRepository.countByStatus(CarStatus.SOLD));
        dto.setTotalAnomalies(dataAnomalyRepository.countByResolved(false));

        Long totalCars = dto.getTotalCars();
        Long listedCars = dto.getListedCars();
        if (totalCars > 0) {
            dto.setConversionRate((listedCars * 100.0) / totalCars);
        } else {
            dto.setConversionRate(0.0);
        }

        Double avgDays = inventoryTurnoverRepository.findOverallAvgDays();
        dto.setAvgDaysInInventory(avgDays != null ? avgDays.intValue() : 0);

        dto.setStageStats(getStageStats());

        return dto;
    }

    @Override
    public List<FunnelStageStatsDTO> getStageStats() {
        List<FunnelStageStatsDTO> result = new ArrayList<>();
        FunnelStage[] stages = FunnelStage.values();

        Map<FunnelStage, String> stageNameMap = new EnumMap<>(FunnelStage.class);
        stageNameMap.put(FunnelStage.ASSESSMENT, "车辆评估");
        stageNameMap.put(FunnelStage.QUOTATION, "报价阶段");
        stageNameMap.put(FunnelStage.DATA_COLLECTION, "资料收集");
        stageNameMap.put(FunnelStage.FINANCE_APPROVAL, "金融审批");
        stageNameMap.put(FunnelStage.LISTING_SUCCESS, "上架成功");

        List<DataAnomaly> unresolvedAnomalies = dataAnomalyRepository.findByResolved(false);
        Map<Long, Integer> carAnomalyCountMap = new HashMap<>();
        for (DataAnomaly anomaly : unresolvedAnomalies) {
            carAnomalyCountMap.merge(anomaly.getCarId(), 1, Integer::sum);
        }

        for (FunnelStage stage : stages) {
            FunnelStageStatsDTO statsDTO = new FunnelStageStatsDTO();
            statsDTO.setStage(stage.name());
            statsDTO.setStageName(stageNameMap.get(stage));

            long total = listingFunnelRepository.countDistinctCarIdByStage(stage);
            long completed = listingFunnelRepository.countByStageAndIsCompleted(stage, true);
            long pending = total - completed;

            statsDTO.setTotalCount(total);
            statsDTO.setCompletedCount(completed);
            statsDTO.setPendingCount(Math.max(0, pending));

            List<ListingFunnel> stageFunnels = listingFunnelRepository.findByStage(stage);
            long anomalyCount = 0;
            for (ListingFunnel funnel : stageFunnels) {
                if (carAnomalyCountMap.containsKey(funnel.getCarId())) {
                    anomalyCount++;
                }
            }
            statsDTO.setAnomalyCount(anomalyCount);

            result.add(statsDTO);
        }

        return result;
    }

    @Override
    @SuppressWarnings("unchecked")
    public FunnelStatsDTO getOverallStatsWithCache() {
        try {
            Object cached = redisTemplate.opsForValue().get(CACHE_KEY_OVERALL);
            if (cached != null) {
                log.debug("从Redis缓存获取漏斗整体统计数据");
                return (FunnelStatsDTO) cached;
            }
        } catch (Exception e) {
            log.warn("读取Redis缓存失败，直接查询数据库: {}", e.getMessage());
        }

        FunnelStatsDTO stats = getOverallStats();

        try {
            redisTemplate.opsForValue().set(CACHE_KEY_OVERALL, stats, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            log.debug("漏斗整体统计数据已写入Redis缓存");
        } catch (Exception e) {
            log.warn("写入Redis缓存失败: {}", e.getMessage());
        }

        return stats;
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<FunnelStageStatsDTO> getStageStatsWithCache() {
        try {
            Object cached = redisTemplate.opsForValue().get(CACHE_KEY_STAGES);
            if (cached != null) {
                log.debug("从Redis缓存获取漏斗阶段统计数据");
                return (List<FunnelStageStatsDTO>) cached;
            }
        } catch (Exception e) {
            log.warn("读取Redis缓存失败，直接查询数据库: {}", e.getMessage());
        }

        List<FunnelStageStatsDTO> stats = getStageStats();

        try {
            redisTemplate.opsForValue().set(CACHE_KEY_STAGES, stats, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
            log.debug("漏斗阶段统计数据已写入Redis缓存");
        } catch (Exception e) {
            log.warn("写入Redis缓存失败: {}", e.getMessage());
        }

        return stats;
    }

    @Override
    public void evictCache() {
        try {
            redisTemplate.delete(Arrays.asList(CACHE_KEY_OVERALL, CACHE_KEY_STAGES));
            log.info("漏斗统计Redis缓存已清除");
        } catch (Exception e) {
            log.warn("清除Redis缓存失败: {}", e.getMessage());
        }
    }
}
