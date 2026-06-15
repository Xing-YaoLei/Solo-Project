package com.youth.training.service;

import com.youth.training.dto.StatusChangeDTO;
import com.youth.training.entity.StatusHistory;
import com.youth.training.repository.StatusHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StatusHistoryService {

    @Autowired
    private StatusHistoryRepository statusHistoryRepository;

    @Transactional
    @CacheEvict(value = "statusHistory", allEntries = true)
    public StatusHistory saveStatusHistory(StatusChangeDTO dto) {
        StatusHistory history = new StatusHistory();
        history.setBusinessId(dto.getBusinessId());
        history.setBusinessType(dto.getBusinessType());
        history.setOldStatus(dto.getOldStatus() != null ? dto.getOldStatus() : "");
        history.setNewStatus(dto.getNewStatus());
        history.setChangeReason(dto.getChangeReason());
        history.setOperator(dto.getOperator());
        return statusHistoryRepository.save(history);
    }

    @Cacheable(value = "statusHistory", key = "'business:' + #businessId + ':' + #businessType")
    public List<StatusHistory> getHistoryByBusiness(Long businessId, String businessType) {
        return statusHistoryRepository.findByBusinessIdAndBusinessTypeOrderByCreateTimeDesc(businessId, businessType);
    }
}
