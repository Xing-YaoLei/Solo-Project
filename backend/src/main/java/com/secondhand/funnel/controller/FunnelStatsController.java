package com.secondhand.funnel.controller;

import com.secondhand.funnel.common.Result;
import com.secondhand.funnel.dto.FunnelStatsDTO;
import com.secondhand.funnel.dto.FunnelStageStatsDTO;
import com.secondhand.funnel.service.FunnelStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/funnel-stats")
@RequiredArgsConstructor
public class FunnelStatsController {

    private final FunnelStatsService funnelStatsService;

    @GetMapping("/overall")
    public Result<FunnelStatsDTO> getOverallStats(@RequestParam(defaultValue = "true") Boolean useCache) {
        FunnelStatsDTO stats = Boolean.TRUE.equals(useCache)
                ? funnelStatsService.getOverallStatsWithCache()
                : funnelStatsService.getOverallStats();
        return Result.success(stats);
    }

    @GetMapping("/stages")
    public Result<List<FunnelStageStatsDTO>> getStageStats(@RequestParam(defaultValue = "true") Boolean useCache) {
        List<FunnelStageStatsDTO> stats = Boolean.TRUE.equals(useCache)
                ? funnelStatsService.getStageStatsWithCache()
                : funnelStatsService.getStageStats();
        return Result.success(stats);
    }

    @DeleteMapping("/cache")
    public Result<Void> evictCache() {
        funnelStatsService.evictCache();
        return Result.success();
    }
}
