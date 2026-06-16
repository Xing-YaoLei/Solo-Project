using Microsoft.AspNetCore.Mvc;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Services;

namespace RehabSettlement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TreatmentCalendarController : ControllerBase
{
    private readonly ITreatmentCalendarService _service;

    public TreatmentCalendarController(ITreatmentCalendarService service)
    {
        _service = service;
    }

    [HttpGet("bill/{billId}")]
    public async Task<ActionResult<List<TreatmentCalendarDto>>> GetByBillId(int billId)
    {
        var result = await _service.GetByBillIdAsync(billId);
        return Ok(result);
    }

    [HttpGet("patient/{patientId}")]
    public async Task<ActionResult<List<TreatmentCalendarDto>>> GetByPatientId(
        int patientId, 
        [FromQuery] DateOnly? startDate, 
        [FromQuery] DateOnly? endDate)
    {
        var result = await _service.GetByPatientIdAsync(patientId, startDate, endDate);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TreatmentCalendarDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<TreatmentCalendarDto>> Create([FromBody] CreateTreatmentCalendarDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TreatmentCalendarDto>> Update(int id, [FromBody] UpdateTreatmentCalendarDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _service.DeleteAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }
}
