using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCareScheduling.API.Controllers;

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
    [ProducesResponseType(typeof(StatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<StatisticsDto>> GetOverview([FromQuery] StatisticsQueryDto query)
    {
        var result = await _statisticsService.GetOverviewStatisticsAsync(query);
        return Ok(result);
    }

    [HttpGet("schedules")]
    [ProducesResponseType(typeof(ScheduleStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ScheduleStatisticsDto>> GetScheduleStatistics([FromQuery] StatisticsQueryDto query)
    {
        var result = await _statisticsService.GetOverviewStatisticsAsync(query);
        return Ok(result.ScheduleStatistics);
    }

    [HttpGet("exceptions")]
    [ProducesResponseType(typeof(ExceptionStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ExceptionStatisticsDto>> GetExceptionStatistics([FromQuery] StatisticsQueryDto query)
    {
        var result = await _statisticsService.GetOverviewStatisticsAsync(query);
        return Ok(result.ExceptionStatistics);
    }

    [HttpGet("carestandards")]
    [ProducesResponseType(typeof(CareStandardStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<CareStandardStatisticsDto>> GetCareStandardStatistics([FromQuery] StatisticsQueryDto query)
    {
        var result = await _statisticsService.GetOverviewStatisticsAsync(query);
        return Ok(result.CareStandardStatistics);
    }

    [HttpGet("sources")]
    [ProducesResponseType(typeof(SourceStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SourceStatisticsDto>> GetSourceStatistics([FromQuery] StatisticsQueryDto query)
    {
        var result = await _statisticsService.GetOverviewStatisticsAsync(query);
        return Ok(result.SourceStatistics);
    }

    [HttpGet("handlers")]
    [ProducesResponseType(typeof(HandlerStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<HandlerStatisticsDto>> GetHandlerStatistics([FromQuery] StatisticsQueryDto query)
    {
        var result = await _statisticsService.GetOverviewStatisticsAsync(query);
        return Ok(result.HandlerStatistics);
    }

    [HttpGet("exceptioncauses")]
    [ProducesResponseType(typeof(ExceptionCauseStatisticsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ExceptionCauseStatisticsDto>> GetExceptionCauseStatistics([FromQuery] StatisticsQueryDto query)
    {
        var result = await _statisticsService.GetOverviewStatisticsAsync(query);
        return Ok(result.ExceptionCauseStatistics);
    }
}
