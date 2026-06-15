using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Models;
using EduSchedule.API.Services;
using EduSchedule.API.Data;

namespace EduSchedule.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;
    private readonly AppDbContext _context;

    public StudentsController(IStudentService studentService, AppDbContext context)
    {
        _studentService = studentService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<Student>>> GetStudents(
        [FromQuery] int? departmentId,
        [FromQuery] int? grade,
        [FromQuery] string? major,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken)
    {
        var query = _context.Students
            .Include(s => s.User)
            .Include(s => s.Department)
            .AsQueryable();

        if (departmentId.HasValue)
            query = query.Where(s => s.DepartmentId == departmentId.Value);

        if (grade.HasValue)
            query = query.Where(s => s.Grade == grade.Value);

        if (!string.IsNullOrWhiteSpace(major))
            query = query.Where(s => s.Major.Contains(major));

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.StudentNumber.Contains(search) ||
                                     s.User.RealName.Contains(search));

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(s => s.StudentNumber)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PaginatedResult<Student>(items, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Student>> GetStudent(int id, CancellationToken cancellationToken)
    {
        var student = await _studentService.GetStudentByIdAsync(id, cancellationToken);
        if (student == null)
        {
            return NotFound();
        }
        return Ok(student);
    }

    [HttpGet("by-number/{studentNumber}")]
    public async Task<ActionResult<Student>> GetStudentByNumber(string studentNumber, CancellationToken cancellationToken)
    {
        var student = await _studentService.GetStudentByNumberAsync(studentNumber, cancellationToken);
        if (student == null)
        {
            return NotFound();
        }
        return Ok(student);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<ActionResult<Student>> PostStudent(Student student, CancellationToken cancellationToken)
    {
        var created = await _studentService.CreateStudentAsync(student, cancellationToken);
        return CreatedAtAction(nameof(GetStudent), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<IActionResult> PutStudent(int id, Student student, CancellationToken cancellationToken)
    {
        if (id != student.Id)
        {
            return BadRequest();
        }

        try
        {
            var updated = await _studentService.UpdateStudentAsync(student, cancellationToken);
            return Ok(updated);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<IActionResult> DeleteStudent(int id, CancellationToken cancellationToken)
    {
        var result = await _studentService.DeleteStudentAsync(id, cancellationToken);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }

    [HttpGet("{id}/enrollments")]
    public async Task<ActionResult<IEnumerable<Enrollment>>> GetStudentEnrollments(int id, [FromQuery] int? semesterId, CancellationToken cancellationToken)
    {
        var enrollments = await _studentService.GetStudentEnrollmentsAsync(id, semesterId, cancellationToken);
        return Ok(enrollments);
    }

    [HttpGet("{id}/transcripts")]
    public async Task<ActionResult<IEnumerable<Transcript>>> GetStudentTranscripts(int id, [FromQuery] int? semesterId, CancellationToken cancellationToken)
    {
        var transcripts = await _studentService.GetStudentTranscriptsAsync(id, semesterId, cancellationToken);
        return Ok(transcripts);
    }
}
