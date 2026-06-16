using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCareScheduling.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EldersController : ControllerBase
{
    private readonly IElderService _elderService;
    private readonly IMedicationService _medicationService;

    public EldersController(IElderService elderService, IMedicationService medicationService)
    {
        _elderService = elderService;
        _medicationService = medicationService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<ElderListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<ElderListDto>>> GetList([FromQuery] ElderQueryDto query)
    {
        var result = await _elderService.GetListAsync(query);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ElderDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ElderDetailDto>> GetById(Guid id)
    {
        var result = await _elderService.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ElderDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ElderDetailDto>> Create([FromBody] CreateElderDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _elderService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ElderDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ElderDetailDto>> Update(Guid id, [FromBody] UpdateElderDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await _elderService.UpdateAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var success = await _elderService.DeleteAsync(id);
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("{id:guid}/medications")]
    [ProducesResponseType(typeof(List<MedicationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<MedicationDto>>> GetMedications(Guid id)
    {
        var result = await _medicationService.GetByElderIdAsync(id);
        return Ok(result);
    }

    [HttpPost("{id:guid}/medications")]
    [ProducesResponseType(typeof(MedicationDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<MedicationDto>> AddMedication(Guid id, [FromBody] CreateMedicationDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (dto.ElderId != id) dto.ElderId = id;
        var result = await _medicationService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetMedications), new { id = result.ElderId }, result);
    }

    [HttpDelete("medications/{medicationId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteMedication(Guid medicationId)
    {
        var success = await _medicationService.DeleteAsync(medicationId);
        if (!success) return NotFound();
        return NoContent();
    }
}
