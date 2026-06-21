using System.Security.Claims;
using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Enums;
using HearingCalendar.API.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HearingCalendar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RemindersController : ControllerBase
{
    private readonly IReminderService _reminderService;

    public RemindersController(IReminderService reminderService)
    {
        _reminderService = reminderService;
    }

    [HttpPost]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Assistant, UserRole.Partner)]
    public async Task<ActionResult<ReminderResponse>> Create([FromBody] CreateReminderRequest request)
    {
        var result = await _reminderService.CreateAsync(request);
        return Ok(result);
    }

    [HttpGet("hearing/{hearingId}")]
    public async Task<ActionResult<IEnumerable<ReminderResponse>>> GetByHearing(Guid hearingId)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _reminderService.GetByHearingAsync(hearingId, callerUserId);
        return Ok(result);
    }

    [HttpGet("pending")]
    [RoleAuthorize(UserRole.Lawyer, UserRole.Assistant, UserRole.Partner, UserRole.Client)]
    public async Task<ActionResult<IEnumerable<ReminderResponse>>> GetPending()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid? callerUserId = userIdClaim is not null ? Guid.Parse(userIdClaim) : null;
        var result = await _reminderService.GetPendingRemindersAsync(callerUserId);
        return Ok(result);
    }
}
