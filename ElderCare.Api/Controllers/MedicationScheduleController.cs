using ElderCare.Api.DTOs;
using ElderCare.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace ElderCare.Api.Controllers;

[ApiController]
[Route("api/schedules")]
public class MedicationScheduleController : ControllerBase
{
    private readonly IMedicationService _service;

    public MedicationScheduleController(IMedicationService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ScheduleDto>>> GetAll()
    {
        var result = await _service.GetAllSchedulesAsync();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ScheduleDto>> GetById(int id)
    {
        var result = await _service.GetScheduleByIdAsync(id);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<ScheduleDto>> Create(CreateScheduleDto dto)
    {
        var result = await _service.CreateScheduleAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ScheduleDto>> Update(int id, UpdateScheduleDto dto)
    {
        var result = await _service.UpdateScheduleAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("elderly/{elderlyId}")]
    public async Task<ActionResult<IEnumerable<ScheduleDto>>> GetByElderly(int elderlyId)
    {
        var result = await _service.GetSchedulesByElderlyAsync(elderlyId);
        return Ok(result);
    }

    [HttpPost("{id}/acknowledge")]
    public async Task<ActionResult<ReminderLogDto>> Acknowledge(int id, AcknowledgeReminderDto dto)
    {
        var result = await _service.AcknowledgeReminderAsync(id, dto);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("{scheduleId}/reminder-logs")]
    public async Task<ActionResult<IEnumerable<ReminderLogDto>>> GetReminderLogs(int scheduleId)
    {
        var result = await _service.GetReminderLogsAsync(scheduleId: scheduleId);
        return Ok(result);
    }
}
