using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Core.Common;

namespace PrescriptionReview.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StatisticsController : BaseController
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpGet("overview")]
    public async Task<ApiResult<StatisticsDto>> GetOverview([FromQuery] StatisticsQueryDto query)
    {
        return await _statisticsService.GetOverviewAsync(query);
    }

    [HttpGet("prescription-trend")]
    public async Task<ApiResult<List<PrescriptionStatisticsDto>>> GetPrescriptionTrend([FromQuery] StatisticsQueryDto query)
    {
        return await _statisticsService.GetPrescriptionTrendAsync(query);
    }

    [HttpGet("store-statistics")]
    [Authorize(Roles = "StoreManager,Headquarters")]
    public async Task<ApiResult<List<StoreStatisticsDto>>> GetStoreStatistics([FromQuery] StatisticsQueryDto query)
    {
        return await _statisticsService.GetStoreStatisticsAsync(query);
    }
}
