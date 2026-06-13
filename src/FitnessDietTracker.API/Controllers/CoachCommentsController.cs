using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessDietTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoachCommentsController : ControllerBase
{
    private readonly ICoachCommentService _service;

    public CoachCommentsController(ICoachCommentService service)
    {
        _service = service;
    }

    [HttpGet("diet-record/{dietRecordId}")]
    public async Task<ActionResult<CoachCommentDto>> GetByDietRecordId(int dietRecordId)
    {
        var result = await _service.GetByDietRecordIdAsync(dietRecordId);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{id}/history")]
    public async Task<ActionResult<List<CoachCommentHistoryDto>>> GetHistory(int id)
    {
        return Ok(await _service.GetHistoryAsync(id));
    }

    [HttpPost]
    public async Task<ActionResult<CoachCommentDto>> Create([FromBody] CoachCommentCreateDto dto)
    {
        try
        {
            var result = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetByDietRecordId), new { dietRecordId = dto.DietRecordId }, result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CoachCommentDto>> Update(
        int id,
        [FromBody] CoachCommentUpdateDto dto,
        [FromQuery] int operatorId)
    {
        var result = await _service.UpdateAsync(id, dto, operatorId);
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
