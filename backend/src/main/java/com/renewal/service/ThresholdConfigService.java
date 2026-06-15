package com.renewal.service;

import com.renewal.dto.ThresholdConfigDTO;

import java.util.List;

public interface ThresholdConfigService {

    List<ThresholdConfigDTO> getAllConfigs();

    List<ThresholdConfigDTO> getConfigsByGroup(String group);

    ThresholdConfigDTO updateConfig(ThresholdConfigDTO dto);
}
