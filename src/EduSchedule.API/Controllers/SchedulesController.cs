using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EduSchedule.API.Models;
using EduSchedule.API.Services;
using EduSchedule.API.Enums;
using EduSchedule.API.Data;

namespace EduSchedule.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _scheduleService;
    private readonly AppDbContext _context;

    public SchedulesController(IScheduleService scheduleService, AppDbContext context)
    {
        _scheduleService = scheduleService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<CourseSchedule>>> GetSchedules(
        [FromQuery] int? semesterId,
        [FromQuery] int? courseId,
        [FromQuery] int? classroomId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken)
    {
        var query = _context.CourseSchedules
            .Include(s => s.Course)
            .Include(s => s.Classroom)
            .Include(s => s.TimeSlot)
            .Include(s => s.Semester)
            .AsQueryable();

        if (semesterId.HasValue)
            query = query.Where(s => s.SemesterId == semesterId.Value);

        if (courseId.HasValue)
            query = query.Where(s => s.CourseId == courseId.Value);

        if (classroomId.HasValue)
            query = query.Where(s => s.ClassroomId == classroomId.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.Course.Name.Contains(search) ||
                                     s.Course.CourseCode.Contains(search) ||
                                     s.Classroom.RoomNumber.Contains(search));

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(s => s.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PaginatedResult<CourseSchedule>(items, total, page, pageSize));
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
