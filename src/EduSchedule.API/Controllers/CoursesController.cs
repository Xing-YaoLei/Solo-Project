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
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;
    private readonly AppDbContext _context;

    public CoursesController(ICourseService courseService, AppDbContext context)
    {
        _courseService = courseService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<Course>>> GetCourses(
        [FromQuery] int? semesterId,
        [FromQuery] int? departmentId,
        [FromQuery] CourseStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken)
    {
        var query = _context.Courses
            .Include(c => c.Department)
            .Include(c => c.Semester)
            .Include(c => c.PrerequisiteCourse)
            .AsQueryable();

        if (semesterId.HasValue)
            query = query.Where(c => c.SemesterId == semesterId.Value);

        if (departmentId.HasValue)
            query = query.Where(c => c.DepartmentId == departmentId.Value);

        if (status.HasValue)
            query = query.Where(c => c.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.Contains(search) ||
                                     c.CourseCode.Contains(search) ||
                                     c.Description!.Contains(search));

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(c => c.CourseCode)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PaginatedResult<Course>(items, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Course>> GetCourse(int id, CancellationToken cancellationToken)
    {
        var course = await _courseService.GetCourseByIdAsync(id, cancellationToken);
        if (course == null)
        {
            return NotFound();
        }
        return Ok(course);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead")]
    public async Task<ActionResult<Course>> PostCourse(Course course, CancellationToken cancellationToken)
    {
        var created = await _courseService.CreateCourseAsync(course, cancellationToken);
        return CreatedAtAction(nameof(GetCourse), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead")]
    public async Task<IActionResult> PutCourse(int id, Course course, CancellationToken cancellationToken)
    {
        if (id != course.Id)
        {
            return BadRequest();
        }

        try
        {
            var updated = await _courseService.UpdateCourseAsync(course, cancellationToken);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<IActionResult> DeleteCourse(int id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _courseService.DeleteCourseAsync(id, cancellationToken);
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

    [HttpPost("{id}/teachers/{teacherId}")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead")]
    public async Task<IActionResult> AssignTeacher(int id, int teacherId, [FromQuery] bool isMainTeacher = true, CancellationToken cancellationToken = default)
    {
        try
        {
            var result = await _courseService.AssignTeacherAsync(id, teacherId, isMainTeacher, cancellationToken);
            if (!result)
            {
                return NotFound();
            }
            return Ok(new { message = "教师分配成功" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}/teachers/{teacherId}")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead")]
    public async Task<IActionResult> RemoveTeacher(int id, int teacherId, CancellationToken cancellationToken)
    {
        var result = await _courseService.RemoveTeacherAsync(id, teacherId, cancellationToken);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }
}
