package com.secondhand.funnel.service.impl;

import com.secondhand.funnel.entity.ListingFunnel;
import com.secondhand.funnel.enums.FunnelStage;
import com.secondhand.funnel.exception.BusinessException;
import com.secondhand.funnel.repository.ListingFunnelRepository;
import com.secondhand.funnel.service.FunnelStatsService;
import com.secondhand.funnel.service.ListingFunnelService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ListingFunnelServiceImpl implements ListingFunnelService {

    private final ListingFunnelRepository listingFunnelRepository;
    private final FunnelStatsService funnelStatsService;

    @Override
    @Transactional
    public ListingFunnel create(ListingFunnel funnel) {
        if (funnel.getId() != null) {
            funnel.setId(null);
        }
        ListingFunnel saved = listingFunnelRepository.save(funnel);
        funnelStatsService.evictCache();
        log.info("创建漏斗阶段成功: id={}, carId={}, stage={}", saved.getId(), saved.getCarId(), saved.getStage());
        return saved;
    }

    @Override
    public ListingFunnel getById(Long id) {
        return listingFunnelRepository.findById(id)
                .orElseThrow(() -> new BusinessException("漏斗阶段记录不存在: " + id));
    }

    @Override
    public List<ListingFunnel> getByCarId(Long carId) {
        return listingFunnelRepository.findByCarId(carId);
    }

    @Override
    public List<ListingFunnel> getByStage(FunnelStage stage) {
        return listingFunnelRepository.findByStage(stage);
    }

    @Override
    public Optional<ListingFunnel> getByCarIdAndStage(Long carId, FunnelStage stage) {
        return listingFunnelRepository.findByCarIdAndStage(carId, stage);
    }

    @Override
    public List<ListingFunnel> listAll() {
        return listingFunnelRepository.findAll();
    }

    @Override
    @Transactional
    public ListingFunnel completeStage(Long id, String remark) {
        ListingFunnel funnel = getById(id);
        funnel.setIsCompleted(true);
        funnel.setCompletedAt(LocalDateTime.now());
        if (remark != null) {
            funnel.setRemark(remark);
        }
        ListingFunnel saved = listingFunnelRepository.save(funnel);
        funnelStatsService.evictCache();
        log.info("完成漏斗阶段成功: id={}, carId={}, stage={}", id, funnel.getCarId(), funnel.getStage());
        return saved;
    }

    @Override
    @Transactional
    public ListingFunnel update(Long id, ListingFunnel funnel) {
        ListingFunnel existing = getById(id);
        existing.setStage(funnel.getStage());
        existing.setIsCompleted(funnel.getIsCompleted());
        existing.setCompletedAt(funnel.getCompletedAt());
        existing.setRemark(funnel.getRemark());
        ListingFunnel saved = listingFunnelRepository.save(existing);
        funnelStatsService.evictCache();
        log.info("更新漏斗阶段成功: id={}", id);
        return saved;
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!listingFunnelRepository.existsById(id)) {
            throw new BusinessException("漏斗阶段记录不存在: " + id);
        }
        listingFunnelRepository.deleteById(id);
        funnelStatsService.evictCache();
        log.info("删除漏斗阶段成功: id={}", id);
    }
}
