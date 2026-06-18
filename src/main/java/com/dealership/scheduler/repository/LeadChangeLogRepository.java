package com.dealership.scheduler.repository;

import com.dealership.scheduler.entity.LeadChangeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadChangeLogRepository extends JpaRepository<LeadChangeLog, Long> {
    List<LeadChangeLog> findByLeadIdOrderByCreateTimeDesc(Long leadId);
}
