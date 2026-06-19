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
    [ProducesResponseType(typeof(PagedResult<ConflictLogDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<ConflictLogDto>>> GetActiveConflicts(
        [FromQuery] Guid? scenicSpotId,
        [FromQuery] int? status,
        [FromQuery] int? conflictType,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var all = await _conflictService.GetActiveConflictsAsync(scenicSpotId, cancellationToken);
        var query = all.AsEnumerable();

        if (status.HasValue)
            query = query.Where(c => (int)c.Status == status.Value);
        if (conflictType.HasValue)
            query = query.Where(c => (int)c.ConflictType == conflictType.Value);

        var total = query.Count();
        var items = query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok(new PagedResult<ConflictLogDto>
        {
            Items = items,
            TotalCount = total,
            PageIndex = pageIndex,
            PageSize = pageSize
        });
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

    [HttpPost("{id:guid}/process")]
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

    [HttpPost("trigger-detection")]
    [HttpPost("run-detection")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    public async Task<IActionResult> TriggerDetection(CancellationToken cancellationToken)
    {
        await _conflictService.RunScheduledConflictDetectionAsync(cancellationToken);
        return Accepted(new { message = "冲突检测已触发执行" });
    }
}
