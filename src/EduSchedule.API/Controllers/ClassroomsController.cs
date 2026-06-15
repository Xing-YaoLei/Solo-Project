using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Models;
using EduSchedule.API.Services;
using EduSchedule.API.Enums;
using EduSchedule.API.Data;

namespace EduSchedule.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassroomsController : ControllerBase
{
    private readonly IClassroomService _classroomService;
    private readonly AppDbContext _context;

    public ClassroomsController(IClassroomService classroomService, AppDbContext context)
    {
        _classroomService = classroomService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<Classroom>>> GetClassrooms(
        [FromQuery] RoomType? type,
        [FromQuery] int? minCapacity,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken)
    {
        var query = _context.Classrooms.AsQueryable();

        if (type.HasValue)
            query = query.Where(c => c.Type == type.Value);

        if (minCapacity.HasValue)
            query = query.Where(c => c.Capacity >= minCapacity.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.RoomNumber.Contains(search) ||
                                     c.Name.Contains(search) ||
                                     c.Building.Contains(search));

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(c => c.Building)
            .ThenBy(c => c.RoomNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PaginatedResult<Classroom>(items, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Classroom>> GetClassroom(int id, CancellationToken cancellationToken)
    {
        var classroom = await _classroomService.GetClassroomByIdAsync(id, cancellationToken);
        if (classroom == null)
        {
            return NotFound();
        }
        return Ok(classroom);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<ActionResult<Classroom>> PostClassroom(Classroom classroom, CancellationToken cancellationToken)
    {
        var created = await _classroomService.CreateClassroomAsync(classroom, cancellationToken);
        return CreatedAtAction(nameof(GetClassroom), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<IActionResult> PutClassroom(int id, Classroom classroom, CancellationToken cancellationToken)
    {
        if (id != classroom.Id)
        {
            return BadRequest();
        }

        try
        {
            var updated = await _classroomService.UpdateClassroomAsync(classroom, cancellationToken);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<IActionResult> DeleteClassroom(int id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _classroomService.DeleteClassroomAsync(id, cancellationToken);
            if (!result)
            {
                return NotFound();
            }
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("available")]
    public async Task<ActionResult<IEnumerable<Classroom>>> GetAvailableClassrooms(
        [FromQuery] int semesterId,
        [FromQuery] WeekDay dayOfWeek,
        [FromQuery] int timeSlotId,
        [FromQuery] int startWeek,
        [FromQuery] int endWeek,
        [FromQuery] RoomType? requiredType,
        [FromQuery] int? minCapacity,
        CancellationToken cancellationToken)
    {
        var classrooms = await _classroomService.GetAvailableClassroomsAsync(
            semesterId, dayOfWeek, timeSlotId, startWeek, endWeek, requiredType, minCapacity, cancellationToken);
        return Ok(classrooms);
    }

    [HttpGet("usage-report/{semesterId}")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<ActionResult<IEnumerable<ClassroomUsageDto>>> GetClassroomUsageReport(int semesterId, CancellationToken cancellationToken)
    {
        var report = await _classroomService.GetClassroomUsageReportAsync(semesterId, cancellationToken);
        return Ok(report);
    }
}
