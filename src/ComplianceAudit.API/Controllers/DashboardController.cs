using Microsoft.AspNetCore.Mvc;
using ComplianceAudit.API.DTOs;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;

namespace ComplianceAudit.API.Controllers;

public class DashboardController : ApiControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public DashboardController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var userId = GetCurrentUserId();
        var role = GetCurrentUserRole() ?? AuditRole.Auditor;
        var stats = await _statisticsService.GetDashboardStatsAsync(userId, role);
        return OkResult(stats);
    }

    [HttpGet("schedule-status-summary")]
    public async Task<IActionResult> GetScheduleStatusSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _statisticsService.GetScheduleStatusSummaryAsync(startDate, endDate);
        return OkResult(result);
    }

    [HttpGet("risk-distribution")]
    public async Task<IActionResult> GetRiskDistribution()
    {
        var result = await _statisticsService.GetRiskDistributionAsync();
        return OkResult(result);
    }
}
