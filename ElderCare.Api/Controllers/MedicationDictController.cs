using ElderCare.Api.DTOs;
using ElderCare.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCare.Api.Controllers;

[ApiController]
[Route("api/medication-dict")]
public class MedicationDictController : ControllerBase
{
    private readonly IMedicationService _service;

    public MedicationDictController(IMedicationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MedicationDictDto>>> GetAll()
    {
        var result = await _service.GetAllMedicationsAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MedicationDictDto>> GetById(int id)
    {
        var result = await _service.GetMedicationByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<MedicationDictDto>> Create(CreateMedicationDictDto dto)
    {
        var result = await _service.CreateMedicationAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<MedicationDictDto>> Update(int id, UpdateMedicationDictDto dto)
    {
        var result = await _service.UpdateMedicationAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteMedicationAsync(id);
        if (!deleted) return NotFound();
        return NoContent();
    }
}
