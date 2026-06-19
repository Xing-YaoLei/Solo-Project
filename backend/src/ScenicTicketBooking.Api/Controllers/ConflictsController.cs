using Microsoft.AspNetCore.Mvc;
using ScenicTicketBooking.Application.Services;
using ScenicTicketBooking.Shared.DTOs;

namespace ScenicTicketBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ConflictsController : ControllerBase
{
    private readonly IConflictDetectionService _conflictService;

    public ConflictsController(IConflictDetectionService conflictService)
    {
        _conflictService = conflictService;
    }

    [HttpGet("active")]
    [ProducesResponseType(typeof(IEnumerable<ConflictLogDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ConflictLogDto>>> GetActiveConflicts(
        [FromQuery] Guid? scenicSpotId,
        CancellationToken cancellationToken)
    {
        var result = await _conflictService.GetActiveConflictsAsync(scenicSpotId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ConflictLogDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ConflictLogDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await _conflictService.GetConflictByIdAsync(id, cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPut("{id:guid}/process")]
    [ProducesResponseType(typeof(ConflictLogDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ConflictLogDto>> Process(
        Guid id,
        [FromBody] ProcessConflictDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _conflictService.ProcessConflictAsync(id, dto, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("run-detection")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> RunDetection(CancellationToken cancellationToken)
    {
        await _conflictService.RunScheduledConflictDetectionAsync(cancellationToken);
        return Accepted();
    }
}
