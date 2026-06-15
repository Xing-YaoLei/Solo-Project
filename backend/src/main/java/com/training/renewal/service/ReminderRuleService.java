package com.training.renewal.service;

import com.training.renewal.entity.ReminderRule;
import com.training.renewal.repository.ReminderRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class ReminderRuleService {

    private final ReminderRuleRepository ruleRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_PREFIX = "rule:";
    private static final long CACHE_EXPIRE = 1800;

    @Transactional
    public ReminderRule createRule(ReminderRule rule, String operatorId, String operatorName,
                                   String changeReason) {
        String version = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd.HHmmss"));
        rule.setVersion(version);
        rule.setOperatorId(operatorId);
        rule.setOperatorName(operatorName);
        rule.setChangeReason(changeReason);

        if (rule.getStatus() == null) {
            rule.setStatus("ACTIVE");
        }
        if (rule.getSortOrder() == null) {
            rule.setSortOrder(100);
        }

        ReminderRule saved = ruleRepository.save(rule);
        evictRuleCache();
        return saved;
    }

    @Transactional
    public ReminderRule updateRule(Long id, ReminderRule rule, String operatorId,
                                   String operatorName, String changeReason) {
        ReminderRule existing = ruleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("规则不存在"));

        if (rule.getRuleName() != null) existing.setRuleName(rule.getRuleName());
        if (rule.getRuleType() != null) existing.setRuleType(rule.getRuleType());
        if (rule.getRuleCondition() != null) existing.setRuleCondition(rule.getRuleCondition());
        if (rule.getRuleAction() != null) existing.setRuleAction(rule.getRuleAction());
        if (rule.getTriggerDaysBefore() != null) existing.setTriggerDaysBefore(rule.getTriggerDaysBefore());
        if (rule.getProgressThreshold() != null) existing.setProgressThreshold(rule.getProgressThreshold());
        if (rule.getScoreThreshold() != null) existing.setScoreThreshold(rule.getScoreThreshold());
        if (rule.getReminderLevel() != null) existing.setReminderLevel(rule.getReminderLevel());
        if (rule.getStatus() != null) existing.setStatus(rule.getStatus());
        if (rule.getSortOrder() != null) existing.setSortOrder(rule.getSortOrder());

        String version = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd.HHmmss"));
        existing.setVersion(version);
        existing.setOperatorId(operatorId);
        existing.setOperatorName(operatorName);
        existing.setChangeReason(changeReason);

        ReminderRule saved = ruleRepository.save(existing);
        evictRuleCache();
        return saved;
    }

    public List<ReminderRule> getActiveRules() {
        String cacheKey = CACHE_PREFIX + "active";
        @SuppressWarnings("unchecked")
        List<ReminderRule> cached = (List<ReminderRule>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<ReminderRule> rules = ruleRepository.findActiveRules();
        redisTemplate.opsForValue().set(cacheKey, rules, CACHE_EXPIRE, TimeUnit.SECONDS);
        return rules;
    }

    public List<ReminderRule> getRecentChanges(int limit) {
        return ruleRepository.findRecentChanges(limit);
    }

    public List<ReminderRule> getRulesByType(String ruleType) {
        return ruleRepository.findByRuleTypeOrderByCreateTimeDesc(ruleType);
    }

    public List<Map<String, Object>> getRuleTypeStats() {
        List<Object[]> raw = ruleRepository.getActiveRuleTypeStats();
        return raw.stream().map(arr -> Map.of(
                "type", arr[0],
                "count", arr[1]
        )).toList();
    }

    public ReminderRule getRuleById(Long id) {
        return ruleRepository.findById(id).orElse(null);
    }

    public List<Map<String, Object>> getVersionDistribution() {
        List<Object[]> raw = ruleRepository.getVersionDistribution();
        return raw.stream().map(arr -> Map.of(
                "version", arr[0],
                "count", arr[1]
        )).toList();
    }

    private void evictRuleCache() {
        Set<String> keys = redisTemplate.keys(CACHE_PREFIX + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
