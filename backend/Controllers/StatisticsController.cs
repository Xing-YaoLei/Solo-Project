using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Services;

namespace CarServiceAppointment.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[SwaggerTag("数据统计")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpGet("overview")]
    [SwaggerOperation(Summary = "获取概览统计")]
    public async Task<ActionResult<StatisticsOverviewDto>> GetOverview([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = await _statisticsService.GetOverviewAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("source-distribution")]
    [SwaggerOperation(Summary = "获取预约来源分布")]
    public async Task<ActionResult<List<SourceDistributionDto>>> GetSourceDistribution([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = await _statisticsService.GetSourceDistributionAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("person-performance")]
    [SwaggerOperation(Summary = "获取负责人业绩")]
    public async Task<ActionResult<List<PersonPerformanceDto>>> GetPersonPerformance([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = await _statisticsService.GetPersonPerformanceAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("conclusion-distribution")]
    [SwaggerOperation(Summary = "获取处理结论分布")]
    public async Task<ActionResult<List<ConclusionDistributionDto>>> GetConclusionDistribution([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = await _statisticsService.GetConclusionDistributionAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("repair-return-rate")]
    [SwaggerOperation(Summary = "获取返修率")]
    public async Task<ActionResult<decimal>> GetRepairReturnRate([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = await _statisticsService.GetRepairReturnRateAsync(startDate, endDate);
        return Ok(result);
    }

    [HttpGet("monthly/{year}")]
    [SwaggerOperation(Summary = "获取月度统计")]
    public async Task<ActionResult<List<MonthlyStatisticsDto>>> GetMonthlyStatistics(int year)
    {
        var result = await _statisticsService.GetMonthlyStatisticsAsync(year);
        return Ok(result);
    }
}
