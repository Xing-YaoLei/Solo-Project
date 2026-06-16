using Microsoft.AspNetCore.Mvc;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Services;

namespace RehabSettlement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NursingLogsController : ControllerBase
{
    private readonly INursingLogService _service;

    public NursingLogsController(INursingLogService service)
    {
        _service = service;
    }

    [HttpGet("bill/{billId}")]
    public async Task<ActionResult<List<NursingLogDto>>> GetByBillId(int billId)
    {
        var result = await _service.GetByBillIdAsync(billId);
        return Ok(result);
    }

    [HttpGet("patient/{patientId}")]
    public async Task<ActionResult<List<NursingLogDto>>> GetByPatientId(int patientId)
    {
        var result = await _service.GetByPatientIdAsync(patientId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NursingLogDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<NursingLogDto>> Create([FromBody] CreateNursingLogDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<NursingLogDto>> Update(int id, [FromBody] CreateNursingLogDto dto)
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
