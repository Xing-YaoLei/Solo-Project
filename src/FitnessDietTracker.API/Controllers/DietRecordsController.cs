using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessDietTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DietRecordsController : ControllerBase
{
    private readonly IDietRecordService _service;

    public DietRecordsController(IDietRecordService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<DietRecordDto>>> GetByUser(
        [FromQuery] int userId,
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        return Ok(await _service.GetRecordsWithDetailsAsync(userId, startDate, endDate));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<DietRecordDto>> GetById(int id)
    {
        var record = await _service.GetByIdAsync(id);
        if (record == null) return NotFound();
        return Ok(record);
    }

    [HttpPost]
    public async Task<ActionResult<DietRecordDto>> Create([FromBody] DietRecordCreateDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<DietRecordDto>> Update(int id, [FromBody] DietRecordUpdateDto dto)
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
