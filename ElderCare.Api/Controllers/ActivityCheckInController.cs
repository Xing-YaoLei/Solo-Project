using ElderCare.Api.DTOs;
using ElderCare.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCare.Api.Controllers;

[ApiController]
[Route("api/activity-checkins")]
public class ActivityCheckInController : ControllerBase
{
    private readonly IActivityService _service;

    public ActivityCheckInController(IActivityService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CheckInDto>>> GetAll()
    {
        var result = await _service.GetAllCheckInsAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<CheckInDto>> Create(CreateCheckInDto dto)
    {
        var result = await _service.CreateCheckInAsync(dto);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpGet("stats")]
    public async Task<ActionResult<IEnumerable<CheckInStatsDto>>> GetStats([FromQuery] int? elderlyId)
    {
        var result = await _service.GetCheckInStatsAsync(elderlyId);
        return Ok(result);
    }
}
