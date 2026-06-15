package com.renewal.service.impl;

import com.renewal.dto.ThresholdConfigDTO;
import com.renewal.entity.ThresholdConfig;
import com.renewal.repository.ThresholdConfigRepository;
import com.renewal.service.ThresholdConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ThresholdConfigServiceImpl implements ThresholdConfigService {

    private final ThresholdConfigRepository thresholdConfigRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CACHE_KEY_PREFIX = "threshold:";
    private static final long CACHE_TTL_HOURS = 4;

    @Override
    public List<ThresholdConfigDTO> getAllConfigs() {
        return thresholdConfigRepository.findAllByOrderByConfigGroupAscConfigKeyAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ThresholdConfigDTO> getConfigsByGroup(String group) {
        return thresholdConfigRepository.findByConfigGroup(group).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ThresholdConfigDTO updateConfig(ThresholdConfigDTO dto) {
        ThresholdConfig config = thresholdConfigRepository.findByConfigKey(dto.getConfigKey())
                .orElse(new ThresholdConfig());

        if (dto.getConfigName() != null) config.setConfigName(dto.getConfigName());
        if (dto.getConfigValue() != null) config.setConfigValue(dto.getConfigValue());
        if (dto.getConfigUnit() != null) config.setConfigUnit(dto.getConfigUnit());
        if (dto.getConfigGroup() != null) config.setConfigGroup(dto.getConfigGroup());
        if (dto.getDescription() != null) config.setDescription(dto.getDescription());
        config.setUpdatedBy(dto.getUpdatedBy());

        if (config.getConfigKey() == null) {
            config.setConfigKey(dto.getConfigKey());
        }

        config = thresholdConfigRepository.save(config);

        redisTemplate.delete(CACHE_KEY_PREFIX + config.getConfigKey());
        redisTemplate.delete(CACHE_KEY_PREFIX + "all");

        return toDTO(config);
    }

    private ThresholdConfigDTO toDTO(ThresholdConfig config) {
        ThresholdConfigDTO dto = new ThresholdConfigDTO();
        dto.setId(config.getId());
        dto.setConfigKey(config.getConfigKey());
        dto.setConfigName(config.getConfigName());
        dto.setConfigValue(config.getConfigValue());
        dto.setConfigUnit(config.getConfigUnit());
        dto.setConfigGroup(config.getConfigGroup());
        dto.setDescription(config.getDescription());
        dto.setUpdatedBy(config.getUpdatedBy());
        return dto;
    }
}
