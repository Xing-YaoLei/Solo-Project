package com.training.renewal.service;

import com.training.renewal.entity.ImportBatch;
import com.training.renewal.repository.ImportBatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class BatchService {

    private final ImportBatchRepository batchRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${renewal.cache.expire-seconds:3600}")
    private long cacheExpireSeconds;

    @Value("${renewal.sync.delay-threshold-hours:24}")
    private int delayThresholdHours;

    private static final String CACHE_PREFIX = "batch:";

    public String generateBatchId(String batchType) {
        return batchType.toUpperCase() + "_" +
               LocalDateTime.now().toString().replace(":", "").replace(".", "") + "_" +
               UUID.randomUUID().toString().substring(0, 8);
    }

    @Transactional
    public ImportBatch createBatch(String batchType, String batchName, String operatorId,
                                   String operatorName, String remark) {
        ImportBatch batch = new ImportBatch();
        batch.setBatchId(generateBatchId(batchType));
        batch.setBatchType(batchType);
        batch.setBatchName(batchName);
        batch.setBatchTime(LocalDateTime.now());
        batch.setStatus("PROCESSING");
        batch.setOperatorId(operatorId);
        batch.setOperatorName(operatorName);
        batch.setRemark(remark);
        batch.setExpectedSyncTime(LocalDateTime.now().plus(delayThresholdHours, ChronoUnit.HOURS));

        return batchRepository.save(batch);
    }

    @Transactional
    public ImportBatch completeBatch(String batchId, int totalCount, int successCount, int failCount) {
        ImportBatch batch = batchRepository.findByBatchId(batchId)
                .orElseThrow(() -> new RuntimeException("批次不存在: " + batchId));

        batch.setTotalCount(totalCount);
        batch.setSuccessCount(successCount);
        batch.setFailCount(failCount);
        batch.setStatus("COMPLETED");
        batch.setActualSyncTime(LocalDateTime.now());

        if (batch.getExpectedSyncTime() != null &&
            batch.getActualSyncTime().isAfter(batch.getExpectedSyncTime())) {
            batch.setIsDelayed(true);
        }

        ImportBatch saved = batchRepository.save(batch);
        evictBatchCache(batchId);
        return saved;
    }

    @Transactional
    public ImportBatch failBatch(String batchId, String failReason) {
        ImportBatch batch = batchRepository.findByBatchId(batchId)
                .orElseThrow(() -> new RuntimeException("批次不存在: " + batchId));

        batch.setStatus("FAILED");
        batch.setRemark(batch.getRemark() + " | 失败原因: " + failReason);

        return batchRepository.save(batch);
    }

    public ImportBatch getBatch(String batchId) {
        String cacheKey = CACHE_PREFIX + batchId;
        ImportBatch cached = (ImportBatch) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        ImportBatch batch = batchRepository.findByBatchId(batchId).orElse(null);
        if (batch != null) {
            redisTemplate.opsForValue().set(cacheKey, batch, cacheExpireSeconds, TimeUnit.SECONDS);
        }
        return batch;
    }

    public List<ImportBatch> getRecentBatches(int limit) {
        return batchRepository.findTop10ByOrderByBatchTimeDesc()
                .stream()
                .limit(limit)
                .toList();
    }

    public List<ImportBatch> getBatchesByType(String batchType) {
        return batchRepository.findByBatchTypeOrderByBatchTimeDesc(batchType);
    }

    public List<ImportBatch> getDelayedBatches() {
        return batchRepository.findDelayedBatches();
    }

    public List<ImportBatch> getBatchesByTimeRange(String batchType, LocalDateTime startTime, LocalDateTime endTime) {
        return batchRepository.findByBatchTypeAndTimeRange(batchType, startTime, endTime);
    }

    private void evictBatchCache(String batchId) {
        redisTemplate.delete(CACHE_PREFIX + batchId);
    }
}
