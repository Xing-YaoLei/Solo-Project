using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using EduSchedule.API.Models;
using EduSchedule.API.Services;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public SchedulesController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CourseSchedule>>> GetSchedules(
        [FromQuery] int? semesterId,
        [FromQuery] int? courseId,
        [FromQuery] int? classroomId,
        CancellationToken cancellationToken)
    {
        var schedules = await _scheduleService.GetSchedulesAsync(semesterId, courseId, classroomId, cancellationToken);
        return Ok(schedules);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CourseSchedule>> GetSchedule(int id, CancellationToken cancellationToken)
    {
        var schedule = await _scheduleService.GetScheduleByIdAsync(id, cancellationToken);
        if (schedule == null) return NotFound();
        return Ok(schedule);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Teacher")]
    public async Task<ActionResult<CourseSchedule>> PostSchedule(CourseSchedule schedule, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out int userId))
        {
            schedule.CreatedBy = userId;
        }

        var created = await _scheduleService.CreateScheduleAsync(schedule, cancellationToken);
        return CreatedAtAction(nameof(GetSchedule), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Teacher")]
    public async Task<IActionResult> PutSchedule(int id, CourseSchedule schedule, CancellationToken cancellationToken)
    {
        if (id != schedule.Id) return BadRequest();

        try
        {
            var updated = await _scheduleService.UpdateScheduleAsync(schedule, cancellationToken);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead")]
    public async Task<IActionResult> DeleteSchedule(int id, CancellationToken cancellationToken)
    {
        var result = await _scheduleService.DeleteScheduleAsync(id, cancellationToken);
        if (!result) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/submit")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Teacher")]
    public async Task<IActionResult> SubmitForApproval(int id, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

        try
        {
            await _scheduleService.SubmitForApprovalAsync(id, userId, cancellationToken);
            return Ok(new { message = "已提交审核" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApprovalRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

        try
        {
            await _scheduleService.ApproveScheduleAsync(id, userId, request.Comments, cancellationToken);
            return Ok(new { message = "审核通过" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<IActionResult> Reject(int id, [FromBody] ApprovalRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

        try
        {
            await _scheduleService.RejectScheduleAsync(id, userId, request.Comments ?? "拒绝", cancellationToken);
            return Ok(new { message = "已拒绝" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("weekly")]
    public async Task<ActionResult<IEnumerable<CourseSchedule>>> GetWeeklySchedule(
        [FromQuery] int semesterId,
        [FromQuery] int? classroomId,
        [FromQuery] int? courseId,
        [FromQuery] int? teacherId,
        CancellationToken cancellationToken)
    {
        var schedules = await _scheduleService.GetWeeklyScheduleAsync(semesterId, classroomId, courseId, teacherId, cancellationToken);
        return Ok(schedules);
    }

    [HttpPost("detect-conflicts/{semesterId}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<ActionResult<IEnumerable<Conflict>>> DetectConflicts(int semesterId, CancellationToken cancellationToken)
    {
        var conflicts = await _scheduleService.DetectConflictsAsync(semesterId, cancellationToken);
        return Ok(conflicts);
    }

    [HttpPost("check-conflict")]
    public async Task<ActionResult<bool>> CheckConflict([FromBody] CourseSchedule schedule, CancellationToken cancellationToken)
    {
        var hasConflict = await _scheduleService.CheckScheduleConflictAsync(schedule, cancellationToken);
        return Ok(hasConflict);
    }
}

public class ApprovalRequest
{
    public string? Comments { get; set; }
}
