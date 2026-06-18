package com.secondhand.funnel.service;

import com.secondhand.funnel.dto.FunnelStatsDTO;
import com.secondhand.funnel.dto.FunnelStageStatsDTO;

import java.util.List;

public interface FunnelStatsService {
    FunnelStatsDTO getOverallStats();
    List<FunnelStageStatsDTO> getStageStats();
    FunnelStatsDTO getOverallStatsWithCache();
    List<FunnelStageStatsDTO> getStageStatsWithCache();
    void evictCache();
}
