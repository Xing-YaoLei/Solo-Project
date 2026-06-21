using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HearingCalendar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<StatisticsOverviewResponse>> GetOverview(
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null)
    {
        var result = await _statisticsService.GetOverviewAsync(from, to);
        return Ok(result);
    }

    [HttpGet("client-satisfaction")]
    public async Task<ActionResult<IEnumerable<ClientSatisfactionReport>>> GetClientSatisfaction(
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null)
    {
        var result = await _statisticsService.GetClientSatisfactionAsync(from, to);
        return Ok(result);
    }

    [HttpGet("hearing-stats")]
    public async Task<ActionResult<IEnumerable<HearingStatistics>>> GetHearingStatistics(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to)
    {
        var result = await _statisticsService.GetHearingStatisticsAsync(from, to);
        return Ok(result);
    }

    [HttpGet("client-satisfaction/{clientId}")]
    public async Task<ActionResult<ClientSatisfactionReport>> GetClientSatisfactionDetail(Guid clientId)
    {
        var result = await _statisticsService.GetClientSatisfactionDetailAsync(clientId);
        return Ok(result);
    }
}
