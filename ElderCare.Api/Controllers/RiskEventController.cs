using ElderCare.Api.DTOs;
using ElderCare.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCare.Api.Controllers;

[ApiController]
[Route("api/risk-events")]
public class RiskEventController : ControllerBase
{
    private readonly IRiskEventService _service;

    public RiskEventController(IRiskEventService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RiskEventDto>>> GetAll()
    {
        var result = await _service.GetAllRiskEventsAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<RiskEventDto>> GetById(int id)
    {
        var result = await _service.GetRiskEventByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<RiskEventDto>> Create(CreateRiskEventDto dto)
    {
        var result = await _service.CreateRiskEventAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<RiskEventDto>> Update(int id, UpdateRiskEventDto dto)
    {
        var result = await _service.UpdateRiskEventAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost("{id}/push")]
    public async Task<ActionResult<ReminderActionDto>> PushReminder(int id, CreateReminderActionDto dto)
    {
        try
        {
            var result = await _service.PushReminderAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/supplement")]
    public async Task<ActionResult<ReminderActionDto>> SupplementReminder(int id, CreateReminderActionDto dto)
    {
        try
        {
            var result = await _service.SupplementReminderAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/retry/{reminderId}")]
    public async Task<ActionResult<ReminderActionDto>> RetryReminder(int id, int reminderId, CreateReminderActionDto dto)
    {
        try
        {
            var result = await _service.RetryReminderAsync(id, reminderId, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/close/{reminderId}")]
    public async Task<ActionResult<ReminderActionDto>> CloseReminder(int id, int reminderId)
    {
        try
        {
            var result = await _service.CloseReminderAsync(id, reminderId);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id}/timeline")]
    public async Task<ActionResult<RiskEventTimelineDto>> GetTimeline(int id)
    {
        try
        {
            var result = await _service.GetRiskEventTimelineAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
