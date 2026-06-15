package com.renewal.repository;

import com.renewal.entity.ReminderRule;
import com.renewal.entity.ReminderRule.RuleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReminderRuleRepository extends JpaRepository<ReminderRule, Long> {

    List<ReminderRule> findByIsActiveTrueOrderByPriorityDesc();

    List<ReminderRule> findByRuleTypeAndIsActiveTrue(RuleType ruleType);
}
