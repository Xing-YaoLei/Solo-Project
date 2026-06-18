package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.FinanceApprovalConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinanceApprovalConfigRepository extends JpaRepository<FinanceApprovalConfig, Long> {
    List<FinanceApprovalConfig> findByChanged(Boolean changed);

    @Query("SELECT f FROM FinanceApprovalConfig f WHERE f.effectiveDate <= :date ORDER BY f.effectiveDate DESC")
    List<FinanceApprovalConfig> findEffectiveConfigs(LocalDate date);

    Optional<FinanceApprovalConfig> findTopByEffectiveDateLessThanEqualOrderByEffectiveDateDesc(LocalDate date);

    long countByChanged(Boolean changed);
}
