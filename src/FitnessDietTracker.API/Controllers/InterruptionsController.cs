using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessDietTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InterruptionsController : ControllerBase
{
    private readonly IInterruptionService _service;

    public InterruptionsController(IInterruptionService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<CheckInInterruptionDto>>> GetAll(
        [FromQuery] int? coachId,
        [FromQuery] int? userId)
    {
        return Ok(await _service.GetAllAsync(coachId, userId));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CheckInInterruptionDto>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{id}/handle")]
    public async Task<ActionResult<CheckInInterruptionDto>> Handle(int id, [FromBody] HandleInterruptionDto dto)
    {
        try
        {
            return Ok(await _service.HandleAsync(id, dto));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
