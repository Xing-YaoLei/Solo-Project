using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Data;
using EduSchedule.API.Models;

namespace EduSchedule.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SemestersController : ControllerBase
{
    private readonly AppDbContext _context;

    public SemestersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Semester>>> GetSemesters(CancellationToken cancellationToken)
    {
        var semesters = await _context.Semesters
            .OrderByDescending(s => s.AcademicYear)
            .ThenByDescending(s => s.Type)
            .ToListAsync(cancellationToken);
        return Ok(semesters);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Semester>> GetSemester(int id, CancellationToken cancellationToken)
    {
        var semester = await _context.Semesters.FindAsync(new object[] { id }, cancellationToken);
        if (semester == null) return NotFound();
        return Ok(semester);
    }

    [HttpGet("current")]
    public async Task<ActionResult<Semester>> GetCurrentSemester(CancellationToken cancellationToken)
    {
        var semester = await _context.Semesters.FirstOrDefaultAsync(s => s.IsCurrent, cancellationToken);
        if (semester == null) return NotFound();
        return Ok(semester);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<ActionResult<Semester>> PostSemester(Semester semester, CancellationToken cancellationToken)
    {
        if (semester.IsCurrent)
        {
            var current = await _context.Semesters.FirstOrDefaultAsync(s => s.IsCurrent, cancellationToken);
            if (current != null)
            {
                current.IsCurrent = false;
            }
        }

        semester.CreatedAt = DateTime.UtcNow;
        _context.Semesters.Add(semester);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetSemester), new { id = semester.Id }, semester);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<IActionResult> PutSemester(int id, Semester semester, CancellationToken cancellationToken)
    {
        if (id != semester.Id) return BadRequest();

        var existing = await _context.Semesters.FindAsync(new object[] { id }, cancellationToken);
        if (existing == null) return NotFound();

        if (semester.IsCurrent && !existing.IsCurrent)
        {
            var current = await _context.Semesters.FirstOrDefaultAsync(s => s.IsCurrent && s.Id != id, cancellationToken);
            if (current != null)
            {
                current.IsCurrent = false;
            }
        }

        existing.AcademicYear = semester.AcademicYear;
        existing.Type = semester.Type;
        existing.StartDate = semester.StartDate;
        existing.EndDate = semester.EndDate;
        existing.CourseSelectionStartDate = semester.CourseSelectionStartDate;
        existing.CourseSelectionEndDate = semester.CourseSelectionEndDate;
        existing.ScheduleStartDate = semester.ScheduleStartDate;
        existing.ScheduleEndDate = semester.ScheduleEndDate;
        existing.Description = semester.Description;
        existing.IsCurrent = semester.IsCurrent;
        existing.IsActive = semester.IsActive;

        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<IActionResult> DeleteSemester(int id, CancellationToken cancellationToken)
    {
        var semester = await _context.Semesters.FindAsync(new object[] { id }, cancellationToken);
        if (semester == null) return NotFound();

        var hasCourses = await _context.Courses.AnyAsync(c => c.SemesterId == id, cancellationToken);
        if (hasCourses)
        {
            return BadRequest(new { message = "该学期已有课程，无法删除" });
        }

        _context.Semesters.Remove(semester);
        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
