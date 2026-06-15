using Microsoft.AspNetCore.Mvc;
using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Services;

namespace CertSchedulePlatform.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProgressAlertsController : ControllerBase
{
    private readonly IProgressAlertService _alertService;

    public ProgressAlertsController(IProgressAlertService alertService)
    {
        _alertService = alertService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ProgressAlertDto>>> GetAlerts(
        [FromQuery] int? userId,
        [FromQuery] int? status,
        [FromQuery] int? severity,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = new AlertQueryDto
        {
            UserId = userId,
            Status = status.HasValue ? (Entities.AlertStatus)status.Value : null,
            Severity = severity.HasValue ? (Entities.AlertSeverity)severity.Value : null,
            StartDate = startDate,
            EndDate = endDate,
            PageIndex = pageIndex,
            PageSize = pageSize
        };

        var result = await _alertService.GetAlertsAsync(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProgressAlertDto>> GetById(int id)
    {
        var alert = await _alertService.GetByIdAsync(id);
        if (alert == null)
            return NotFound();

        return Ok(alert);
    }

    [HttpGet("user/{userId}/active")]
    public async Task<ActionResult<List<ProgressAlertDto>>> GetActiveAlerts(int userId)
    {
        var alerts = await _alertService.GetActiveAlertsByUserAsync(userId);
        return Ok(alerts);
    }

    [HttpGet("count")]
    public async Task<ActionResult<int>> GetOpenCount([FromQuery] int? userId = null)
    {
        var count = await _alertService.GetOpenAlertCountAsync(userId);
        return Ok(count);
    }

    [HttpPut("{id}/handle")]
    public async Task<ActionResult<ProgressAlertDto>> HandleAlert(int id, [FromBody] AlertHandleDto dto)
    {
        var alert = await _alertService.HandleAlertAsync(id, dto);
        if (alert == null)
            return NotFound();

        return Ok(alert);
    }

    [HttpPost("check")]
    public async Task<ActionResult<int>> TriggerCheck()
    {
        var count = await _alertService.CheckAndCreateAlertsAsync();
        return Ok(count);
    }
}
