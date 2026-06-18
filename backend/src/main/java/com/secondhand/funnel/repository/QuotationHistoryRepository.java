package com.secondhand.funnel.repository;

import com.secondhand.funnel.entity.QuotationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationHistoryRepository extends JpaRepository<QuotationHistory, Long> {
    List<QuotationHistory> findByCarIdOrderByQuotedAtDesc(Long carId);
    List<QuotationHistory> findByQuotedBy(Long quotedBy);
}
