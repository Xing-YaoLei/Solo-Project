using Microsoft.AspNetCore.Mvc;
using ScenicTicketBooking.Application.Services;
using ScenicTicketBooking.Shared.DTOs;

namespace ScenicTicketBooking.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ReminderListsController : ControllerBase
{
    private readonly IReminderListService _reminderListService;

    public ReminderListsController(IReminderListService reminderListService)
    {
        _reminderListService = reminderListService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ReminderListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ReminderListDto>>> GetAll(
        [FromQuery] Guid? scenicSpotId,
        CancellationToken cancellationToken)
    {
        var result = await _reminderListService.GetAllReminderListsAsync(scenicSpotId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ReminderListDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReminderListDto>> GetById(
        Guid id,
        [FromQuery] bool includeChangeLogs = true,
        CancellationToken cancellationToken = default)
    {
        var result = await _reminderListService.GetReminderListByIdAsync(id, includeChangeLogs, cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{id:guid}/change-logs")]
    [ProducesResponseType(typeof(IEnumerable<ReminderListChangeLogDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ReminderListChangeLogDto>>> GetChangeLogs(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await _reminderListService.GetChangeLogsAsync(id, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ReminderListDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<ReminderListDto>> Create(
        [FromBody] CreateReminderListDto dto,
        CancellationToken cancellationToken)
    {
        var result = await _reminderListService.CreateReminderListAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ReminderListDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReminderListDto>> Update(
        Guid id,
        [FromBody] UpdateReminderListDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _reminderListService.UpdateReminderListAsync(id, dto, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var success = await _reminderListService.DeleteReminderListAsync(id, cancellationToken);
        if (!success) return NotFound();
        return NoContent();
    }
}
