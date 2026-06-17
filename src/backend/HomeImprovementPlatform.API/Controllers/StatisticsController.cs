using HomeImprovementPlatform.API.DTOs.Statistics;
using HomeImprovementPlatform.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HomeImprovementPlatform.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Designer,Supervisor")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpGet("overview")]
    public async Task<ActionResult<StatisticsOverviewDto>> GetOverview()
    {
        var overview = await _statisticsService.GetOverviewAsync();
        return Ok(overview);
    }

    [HttpGet("payment-cycles")]
    public async Task<ActionResult<IEnumerable<PaymentCycleDto>>> GetPaymentCycles([FromQuery] int months = 12)
    {
        var cycles = await _statisticsService.GetPaymentCyclesAsync(months);
        return Ok(cycles);
    }

    [HttpGet("project-performance")]
    public async Task<ActionResult<IEnumerable<ProjectPerformanceDto>>> GetProjectPerformance()
    {
        var performance = await _statisticsService.GetProjectPerformanceAsync();
        return Ok(performance);
    }

    [HttpGet("amount-inconsistencies")]
    public async Task<ActionResult<IEnumerable<AmountInconsistencyDto>>> GetAmountInconsistencies()
    {
        var inconsistencies = await _statisticsService.GetAmountInconsistenciesAsync();
        return Ok(inconsistencies);
    }
}
