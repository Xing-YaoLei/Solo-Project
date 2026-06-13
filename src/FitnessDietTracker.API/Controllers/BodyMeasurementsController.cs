using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessDietTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BodyMeasurementsController : ControllerBase
{
    private readonly IBodyMeasurementService _service;

    public BodyMeasurementsController(IBodyMeasurementService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<BodyMeasurementDto>>> GetByUser(
        [FromQuery] int userId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        return Ok(await _service.GetByUserAsync(userId, startDate, endDate));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<BodyMeasurementDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<BodyMeasurementDto>> Create([FromBody] BodyMeasurementCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<BodyMeasurementDto>> Update(int id, [FromBody] BodyMeasurementUpdateDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }
}
