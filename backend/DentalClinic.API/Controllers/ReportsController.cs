using DentalClinic.API.DTOs;
using DentalClinic.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
    {
        var stats = await _reportService.GetDashboardStatsAsync();
        return Ok(stats);
    }

    [HttpGet("appointment-rates")]
    public async Task<ActionResult<IEnumerable<AppointmentRateDto>>> GetAppointmentRates(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var rates = await _reportService.GetAppointmentRatesAsync(startDate, endDate);
        return Ok(rates);
    }

    [HttpGet("reappointment-trend")]
    public async Task<ActionResult<IEnumerable<ReAppointmentTrendDto>>> GetReAppointmentTrend(
        [FromQuery] int months = 6)
    {
        var trend = await _reportService.GetReAppointmentTrendAsync(months);
        return Ok(trend);
    }

    [HttpGet("high-risk-noshows")]
    public async Task<ActionResult<IEnumerable<NoShowAppointmentDto>>> GetHighRiskNoShows(
        [FromQuery] int topN = 10)
    {
        var noShows = await _reportService.GetHighRiskNoShowsAsync(topN);
        return Ok(noShows);
    }
}
