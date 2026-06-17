using Microsoft.AspNetCore.Mvc;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.Statistics;
using SiteSchedule.Services;

namespace SiteSchedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _service;

    public StatisticsController(IStatisticsService service)
    {
        _service = service;
    }

    [HttpGet("overview")]
    public async Task<ApiResponse<StatisticsOverviewDto>> GetOverview()
    {
        var result = await _service.GetOverviewAsync();
        return ApiResponse<StatisticsOverviewDto>.Ok(result);
    }

    [HttpGet("material-complete-rates")]
    public async Task<ApiResponse<List<MaterialCompleteRateDto>>> GetMaterialCompleteRates([FromQuery] ReviewQueryDto query)
    {
        var result = await _service.GetMaterialCompleteRatesAsync(query);
        return ApiResponse<List<MaterialCompleteRateDto>>.Ok(result);
    }

    [HttpGet("area-statistics")]
    public async Task<ApiResponse<List<AreaStatisticsDto>>> GetAreaStatistics([FromQuery] ReviewQueryDto query)
    {
        var result = await _service.GetAreaStatisticsAsync(query);
        return ApiResponse<List<AreaStatisticsDto>>.Ok(result);
    }

    [HttpGet("person-statistics")]
    public async Task<ApiResponse<List<PersonStatisticsDto>>> GetPersonStatistics([FromQuery] ReviewQueryDto query)
    {
        var result = await _service.GetPersonStatisticsAsync(query);
        return ApiResponse<List<PersonStatisticsDto>>.Ok(result);
    }

    [HttpGet("material-statistics")]
    public async Task<ApiResponse<List<MaterialStatisticsDto>>> GetMaterialStatistics([FromQuery] ReviewQueryDto query)
    {
        var result = await _service.GetMaterialStatisticsAsync(query);
        return ApiResponse<List<MaterialStatisticsDto>>.Ok(result);
    }
}
