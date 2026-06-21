using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HearingCalendar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RemindersController : ControllerBase
{
    private readonly IReminderService _reminderService;

    public RemindersController(IReminderService reminderService)
    {
        _reminderService = reminderService;
    }

    [HttpPost]
    public async Task<ActionResult<ReminderResponse>> Create([FromBody] CreateReminderRequest request)
    {
        var result = await _reminderService.CreateAsync(request);
        return Ok(result);
    }

    [HttpGet("hearing/{hearingId}")]
    public async Task<ActionResult<IEnumerable<ReminderResponse>>> GetByHearing(Guid hearingId)
    {
        var result = await _reminderService.GetByHearingAsync(hearingId);
        return Ok(result);
    }

    [HttpGet("pending")]
    public async Task<ActionResult<IEnumerable<ReminderResponse>>> GetPending()
    {
        var result = await _reminderService.GetPendingRemindersAsync();
        return Ok(result);
    }
}
