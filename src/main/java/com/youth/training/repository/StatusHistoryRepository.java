package com.youth.training.repository;

import com.youth.training.entity.StatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StatusHistoryRepository extends JpaRepository<StatusHistory, Long> {
    List<StatusHistory> findByBusinessIdAndBusinessTypeOrderByCreateTimeDesc(Long businessId, String businessType);
    List<StatusHistory> findByBusinessTypeOrderByCreateTimeDesc(String businessType);
    List<StatusHistory> findByOperatorOrderByCreateTimeDesc(String operator);

    List<StatusHistory> findByBusinessTypeAndCreateTimeBetweenOrderByCreateTimeDesc(String businessType, LocalDateTime start, LocalDateTime end);

    long countByBusinessType(String businessType);
}
