package com.training.renewal.repository;

import com.training.renewal.entity.ReminderRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReminderRuleRepository extends JpaRepository<ReminderRule, Long> {

    List<ReminderRule> findByStatusOrderBySortOrderAsc(String status);

    List<ReminderRule> findByRuleTypeOrderByCreateTimeDesc(String ruleType);

    @Query("SELECT r FROM ReminderRule r WHERE r.status = 'ACTIVE' ORDER BY r.sortOrder ASC")
    List<ReminderRule> findActiveRules();

    @Query("SELECT r.version, COUNT(r) FROM ReminderRule r GROUP BY r.version ORDER BY r.version DESC")
    List<Object[]> getVersionDistribution();

    @Query("SELECT r.ruleType, COUNT(r) FROM ReminderRule r WHERE r.status = 'ACTIVE' GROUP BY r.ruleType")
    List<Object[]> getActiveRuleTypeStats();

    @Query(value = "SELECT * FROM reminder_rule ORDER BY create_time DESC LIMIT :limit", nativeQuery = true)
    List<ReminderRule> findRecentChanges(@Param("limit") int limit);
}
