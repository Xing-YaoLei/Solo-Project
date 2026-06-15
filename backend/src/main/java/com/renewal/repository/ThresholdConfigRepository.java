package com.renewal.repository;

import com.renewal.entity.ThresholdConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ThresholdConfigRepository extends JpaRepository<ThresholdConfig, Long> {

    Optional<ThresholdConfig> findByConfigKey(String configKey);

    List<ThresholdConfig> findByConfigGroup(String configGroup);

    List<ThresholdConfig> findAllByOrderByConfigGroupAscConfigKeyAsc();
}
