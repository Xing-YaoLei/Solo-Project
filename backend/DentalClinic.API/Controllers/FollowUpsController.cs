using DentalClinic.API.DTOs;
using DentalClinic.API.Enums;
using DentalClinic.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FollowUpsController : ControllerBase
{
    private readonly IFollowUpService _followUpService;

    public FollowUpsController(IFollowUpService followUpService)
    {
        _followUpService = followUpService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FollowUpTaskDto>>> GetFollowUpTasks(
        [FromQuery] FollowUpStatus? status = null,
        [FromQuery] FollowUpType? type = null,
        [FromQuery] int? patientId = null,
        [FromQuery] int? appointmentId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var tasks = await _followUpService.GetFollowUpTasksAsync(
            status, type, patientId, appointmentId, startDate, endDate, page, pageSize);

        var total = await _followUpService.GetFollowUpTaskCountAsync(
            status, type, patientId, appointmentId);

        Response.Headers.Add("X-Total-Count", total.ToString());
        return Ok(tasks);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FollowUpTaskDto>> GetFollowUpTask(int id)
    {
        var task = await _followUpService.GetFollowUpTaskByIdAsync(id);
        if (task == null) return NotFound();
        return Ok(task);
    }

    [HttpPost]
    public async Task<ActionResult<FollowUpTaskDto>> CreateFollowUpTask([FromBody] CreateFollowUpTaskDto dto)
    {
        var task = await _followUpService.CreateFollowUpTaskAsync(dto);
        return CreatedAtAction(nameof(GetFollowUpTask), new { id = task.Id }, task);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<FollowUpTaskDto>> UpdateFollowUpTask(int id, [FromBody] UpdateFollowUpTaskDto dto)
    {
        var task = await _followUpService.UpdateFollowUpTaskAsync(id, dto);
        if (task == null) return NotFound();
        return Ok(task);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFollowUpTask(int id)
    {
        var result = await _followUpService.DeleteFollowUpTaskAsync(id);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPut("{id}/complete")]
    public async Task<IActionResult> CompleteFollowUpTask(int id, [FromQuery] string result, [FromQuery] string completedBy)
    {
        var success = await _followUpService.CompleteFollowUpTaskAsync(id, result, completedBy);
        if (!success) return NotFound();
        return NoContent();
    }
}
