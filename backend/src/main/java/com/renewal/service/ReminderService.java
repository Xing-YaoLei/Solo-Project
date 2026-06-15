package com.renewal.service;

import com.renewal.dto.ReminderRuleDTO;
import com.renewal.dto.RemarkRequest;

import java.util.List;

public interface ReminderService {

    List<ReminderRuleDTO> getActiveRules();

    ReminderRuleDTO getRuleDetail(Long ruleId);

    ReminderRuleDTO updateRule(ReminderRuleDTO ruleDTO);

    void addRemark(RemarkRequest request);

    List<ReminderRuleDTO.TriggerLogItem> getAnomalyLogs(String startDate, String endDate);
}
