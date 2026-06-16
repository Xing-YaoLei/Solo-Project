using Microsoft.AspNetCore.Mvc;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Services;

namespace RehabSettlement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _service;

    public StatisticsController(IStatisticsService service)
    {
        _service = service;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardDto>> GetDashboard(
        [FromQuery] DateOnly? startDate = null, 
        [FromQuery] DateOnly? endDate = null)
    {
        var result = await _service.GetDashboardAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("training-completion-rate")]
    public async Task<ActionResult<TrainingCompletionRateDto>> GetTrainingCompletionRate(
        [FromQuery] DateOnly? startDate = null, 
        [FromQuery] DateOnly? endDate = null)
    {
        var result = await _service.GetTrainingCompletionRateAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("source-channels")]
    public async Task<ActionResult<List<SourceChannelStatisticsDto>>> GetSourceChannelStatistics(
        [FromQuery] DateOnly? startDate = null, 
        [FromQuery] DateOnly? endDate = null)
    {
        var result = await _service.GetSourceChannelStatisticsAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("assignees")]
    public async Task<ActionResult<List<AssigneeStatisticsDto>>> GetAssigneeStatistics(
        [FromQuery] DateOnly? startDate = null, 
        [FromQuery] DateOnly? endDate = null)
    {
        var result = await _service.GetAssigneeStatisticsAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("review-tags")]
    public async Task<ActionResult<List<ReviewTagStatisticsDto>>> GetReviewTagStatistics(
        [FromQuery] DateOnly? startDate = null, 
        [FromQuery] DateOnly? endDate = null)
    {
        var result = await _service.GetReviewTagStatisticsAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("status-overview")]
    public async Task<ActionResult<List<StatusOverviewDto>>> GetStatusOverview(
        [FromQuery] DateOnly? startDate = null, 
        [FromQuery] DateOnly? endDate = null)
    {
        var result = await _service.GetStatusOverviewAsync(startDate, endDate);
        return Ok(result);
    }
}
