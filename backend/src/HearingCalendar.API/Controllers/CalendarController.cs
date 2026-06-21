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
public class CalendarController : ControllerBase
{
    private readonly ICalendarService _calendarService;

    public CalendarController(ICalendarService calendarService)
    {
        _calendarService = calendarService;
    }

    [HttpPost("slots")]
    [RoleAuthorize(UserRole.Partner, UserRole.Assistant)]
    public async Task<ActionResult<CalendarSlotResponse>> CreateSlot([FromBody] CreateCalendarSlotRequest request)
    {
        var result = await _calendarService.CreateSlotAsync(request);
        return Ok(result);
    }

    [HttpGet("slots")]
    public async Task<ActionResult<IEnumerable<CalendarSlotResponse>>> GetSlots(
        [FromQuery] DateOnly from,
        [FromQuery] DateOnly to,
        [FromQuery] string? courtRoom = null)
    {
        var result = await _calendarService.GetSlotsByDateRangeAsync(from, to, courtRoom);
        return Ok(result);
    }

    [HttpPost("capacity-rules")]
    [RoleAuthorize(UserRole.Partner)]
    public async Task<ActionResult<CapacityRuleResponse>> CreateCapacityRule([FromBody] CreateCapacityRuleRequest request)
    {
        var result = await _calendarService.CreateCapacityRuleAsync(request);
        return Ok(result);
    }

    [HttpGet("capacity-rules")]
    public async Task<ActionResult<IEnumerable<CapacityRuleResponse>>> GetActiveCapacityRules()
    {
        var result = await _calendarService.GetActiveCapacityRulesAsync();
        return Ok(result);
    }

    [HttpGet("capacity/validate")]
    public async Task<ActionResult<bool>> ValidateCapacity(
        [FromQuery] DateOnly date,
        [FromQuery] string courtRoom)
    {
        var result = await _calendarService.ValidateCapacityAsync(date, courtRoom);
        return Ok(result);
    }
}
