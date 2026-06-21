using System.Security.Claims;
using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Enums;
using HearingCalendar.API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HearingCalendar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpGet("overview")]
    [RoleAuthorize(UserRole.Partner, UserRole.Lawyer, UserRole.Client)]
    public async Task<ActionResult<StatisticsOverviewResponse>> GetOverview(
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _statisticsService.GetOverviewAsync(from, to, callerUserId);
        return Ok(result);
    }

    [HttpGet("client-satisfaction")]
    [RoleAuthorize(UserRole.Partner, UserRole.Lawyer, UserRole.Client)]
    public async Task<ActionResult<IEnumerable<ClientSatisfactionReport>>> GetClientSatisfaction(
        [FromQuery] DateOnly? from = null,
        [FromQuery] DateOnly? to = null)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _statisticsService.GetClientSatisfactionAsync(from, to, callerUserId);
        return Ok(result);
    }

    [HttpGet("hearing-stats")]
    [RoleAuthorize(UserRole.Partner, UserRole.Lawyer)]
    public async Task<ActionResult<IEnumerable<HearingStatistics>>> GetHearingStatistics(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _statisticsService.GetHearingStatisticsAsync(from, to, callerUserId);
        return Ok(result);
    }

    [HttpGet("client-satisfaction/{clientId}")]
    [RoleAuthorize(UserRole.Partner, UserRole.Lawyer, UserRole.Client)]
    public async Task<ActionResult<ClientSatisfactionReport>> GetClientSatisfactionDetail(Guid clientId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _statisticsService.GetClientSatisfactionDetailAsync(clientId, callerUserId);
        return Ok(result);
    }
}
