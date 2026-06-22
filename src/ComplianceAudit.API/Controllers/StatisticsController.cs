using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ComplianceAudit.API.DTOs;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;
using ComplianceAudit.Infrastructure.Data;

namespace ComplianceAudit.API.Controllers;

public class StatisticsController : ApiControllerBase
{
    private readonly IStatisticsService _statisticsService;
    private readonly ApplicationDbContext _context;

    public StatisticsController(IStatisticsService statisticsService, ApplicationDbContext context)
    {
        _statisticsService = statisticsService;
        _context = context;
    }

    [HttpGet("compliance-rate")]
    public async Task<IActionResult> GetComplianceRateByCategory([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _statisticsService.GetComplianceRateByCategoryAsync(startDate, endDate);
        return OkResult(result);
    }

    [HttpGet("sampling-coverage/{scheduleId}")]
    public async Task<IActionResult> GetSamplingCoverageReport(long scheduleId)
    {
        var result = await _statisticsService.GetSamplingCoverageReportAsync(scheduleId);
        return OkResult(result);
    }

    [HttpGet("document-trace/{documentNo}")]
    public async Task<IActionResult> GetDocumentTrace(string documentNo)
    {
        var result = await _statisticsService.GetDocumentTraceAsync(documentNo);
        return OkResult(result);
    }

    [HttpGet("auditor-performance")]
    [Authorize(Policy = "RequireManagement")]
    public async Task<IActionResult> GetAuditorPerformance([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _statisticsService.GetAuditorPerformanceAsync(startDate, endDate);
        return OkResult(result);
    }

    [HttpGet("rectification-summary")]
    public async Task<IActionResult> GetRectificationSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var result = await _statisticsService.GetRectificationSummaryAsync(startDate, endDate);
        return OkResult(result);
    }

    [HttpGet("evidence-completion")]
    public async Task<IActionResult> GetEvidenceCompletionReport()
    {
        var result = await _statisticsService.GetEvidenceCompletionReportAsync();
        return OkResult(result);
    }
}
