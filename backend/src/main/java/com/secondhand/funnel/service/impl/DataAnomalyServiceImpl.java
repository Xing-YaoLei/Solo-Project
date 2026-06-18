package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.entity.DataAnomaly;
import com.secondhand.funnel.enums.AnomalyType;
import com.secondhand.funnel.exception.BusinessException;
import com.secondhand.funnel.repository.DataAnomalyRepository;
import com.secondhand.funnel.service.DataAnomalyService;
import com.secondhand.funnel.service.FunnelStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataAnomalyServiceImpl implements DataAnomalyService {

    private final DataAnomalyRepository dataAnomalyRepository;
    private final FunnelStatsService funnelStatsService;

    @Override
    @Transactional
    public DataAnomaly create(DataAnomaly anomaly) {
        if (anomaly.getId() != null) {
            anomaly.setId(null);
        }
        if (anomaly.getStartDate() == null) {
            anomaly.setStartDate(LocalDateTime.now());
        }
        if (anomaly.getResolved() == null) {
            anomaly.setResolved(false);
        }
        DataAnomaly saved = dataAnomalyRepository.save(anomaly);
        funnelStatsService.evictCache();
        log.info("创建数据异常标记成功: id={}, carId={}, type={}", saved.getId(), saved.getCarId(), saved.getAnomalyType());
        return saved;
    }

    @Override
    public DataAnomaly getById(Long id) {
        return dataAnomalyRepository.findById(id)
                .orElseThrow(() -> new BusinessException("异常标记不存在: " + id));
    }

    @Override
    public List<DataAnomaly> getByCarId(Long carId) {
        return dataAnomalyRepository.findByCarId(carId);
    }

    @Override
    public List<DataAnomaly> getByAnomalyType(AnomalyType type) {
        return dataAnomalyRepository.findByAnomalyType(type);
    }

    @Override
    public List<DataAnomaly> getUnresolved() {
        return dataAnomalyRepository.findByResolved(false);
    }

    @Override
    public List<DataAnomaly> listAll() {
        return dataAnomalyRepository.findAll();
    }

    @Override
    @Transactional
    public DataAnomaly resolve(Long id, String description) {
        DataAnomaly anomaly = getById(id);
        anomaly.setResolved(true);
        anomaly.setEndDate(LocalDateTime.now());
        if (description != null && !description.trim().isEmpty()) {
            anomaly.setDescription(anomaly.getDescription() == null ? description : anomaly.getDescription() + "; " + description);
        }
        DataAnomaly saved = dataAnomalyRepository.save(anomaly);
        funnelStatsService.evictCache();
        log.info("解决异常标记成功: id={}", id);
        return saved;
    }

    @Override
    @Transactional
    public DataAnomaly update(Long id, DataAnomaly anomaly) {
        DataAnomaly existing = getById(id);
        existing.setAnomalyType(anomaly.getAnomalyType());
        existing.setDescription(anomaly.getDescription());
        existing.setStartDate(anomaly.getStartDate());
        existing.setEndDate(anomaly.getEndDate());
        existing.setResolved(anomaly.getResolved());
        DataAnomaly saved = dataAnomalyRepository.save(existing);
        funnelStatsService.evictCache();
        log.info("更新异常标记成功: id={}", id);
        return saved;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!dataAnomalyRepository.existsById(id)) {
            throw new BusinessException("异常标记不存在: " + id);
        }
        dataAnomalyRepository.deleteById(id);
        funnelStatsService.evictCache();
        log.info("删除异常标记成功: id={}", id);
    }

    @Override
    public long countUnresolved() {
        return dataAnomalyRepository.countByResolved(false);
    }
}
