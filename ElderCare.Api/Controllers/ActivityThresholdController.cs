using ElderCare.Api.DTOs;
using ElderCare.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCare.Api.Controllers;

[ApiController]
[Route("api/activity-thresholds")]
public class ActivityThresholdController : ControllerBase
{
    private readonly IActivityService _service;

    public ActivityThresholdController(IActivityService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ThresholdDto>>> GetAll()
    {
        var result = await _service.GetAllThresholdsAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ThresholdDto>> Create(CreateThresholdDto dto)
    {
        var result = await _service.CreateThresholdAsync(dto);
        return CreatedAtAction(nameof(GetAll), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ThresholdDto>> Update(int id, CreateThresholdDto dto)
    {
        var result = await _service.UpdateThresholdAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }
}
