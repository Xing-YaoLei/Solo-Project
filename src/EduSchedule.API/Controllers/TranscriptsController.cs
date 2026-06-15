using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EduSchedule.API.Data;
using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TranscriptsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TranscriptsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<Transcript>>> GetTranscripts(
        [FromQuery] int? studentId,
        [FromQuery] int? courseId,
        [FromQuery] int? semesterId,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken)
    {
        var query = _context.Transcripts
            .Include(t => t.Student)
                .ThenInclude(s => s.User)
            .Include(t => t.Course)
            .Include(t => t.Semester)
            .AsQueryable();

        if (studentId.HasValue)
            query = query.Where(t => t.StudentId == studentId.Value);

        if (courseId.HasValue)
            query = query.Where(t => t.CourseId == courseId.Value);

        if (semesterId.HasValue)
            query = query.Where(t => t.SemesterId == semesterId.Value);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(t => t.Course.Name.Contains(search) ||
                                     t.Student.StudentNumber.Contains(search) ||
                                     t.Student.User.RealName.Contains(search));

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PaginatedResult<Transcript>(items, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Transcript>> GetTranscript(int id, CancellationToken cancellationToken)
    {
        var transcript = await _context.Transcripts
            .Include(t => t.Student)
                .ThenInclude(s => s.User)
            .Include(t => t.Course)
            .Include(t => t.Semester)
            .Include(t => t.Details)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);

        if (transcript == null) return NotFound();
        return Ok(transcript);
    }

    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<IEnumerable<Transcript>>> GetByStudent(int studentId, [FromQuery] int? semesterId, CancellationToken cancellationToken)
    {
        var query = _context.Transcripts
            .Include(t => t.Course)
            .Include(t => t.Semester)
            .Where(t => t.StudentId == studentId)
            .AsQueryable();

        if (semesterId.HasValue)
            query = query.Where(t => t.SemesterId == semesterId.Value);

        var transcripts = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(transcripts);
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Administrator,AcademicAffairs,Teacher")]
    public async Task<ActionResult<TranscriptStatsDto>> GetStats(CancellationToken cancellationToken)
    {
        var totalTranscripts = await _context.Transcripts.CountAsync(cancellationToken);
        var passedCount = await _context.Transcripts.CountAsync(t => t.FinalGrade >= 60, cancellationToken);
        var averageGrade = await _context.Transcripts
            .Where(t => t.FinalGrade.HasValue)
            .AverageAsync(t => t.FinalGrade!.Value, cancellationToken);

        var stats = new TranscriptStatsDto
        {
            TotalTranscripts = totalTranscripts,
            PassedCount = passedCount,
            FailedCount = totalTranscripts - passedCount,
            PassRate = totalTranscripts > 0 ? (double)passedCount / totalTranscripts : 0,
            AverageGrade = averageGrade,
            AverageGpa = await _context.Students
                .Where(s => s.IsActive)
                .AverageAsync(s => s.GPA, cancellationToken)
        };

        return Ok(stats);
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,AcademicAffairs,Teacher")]
    public async Task<ActionResult<Transcript>> PostTranscript(Transcript transcript, CancellationToken cancellationToken)
    {
        _context.Transcripts.Add(transcript);
        await _context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetTranscript), new { id = transcript.Id }, transcript);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs,Teacher")]
    public async Task<IActionResult> PutTranscript(int id, Transcript transcript, CancellationToken cancellationToken)
    {
        if (id != transcript.Id) return BadRequest();

        _context.Entry(transcript).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!TranscriptExists(id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<IActionResult> DeleteTranscript(int id, CancellationToken cancellationToken)
    {
        var transcript = await _context.Transcripts.FindAsync(new object[] { id }, cancellationToken);
        if (transcript == null) return NotFound();

        _context.Transcripts.Remove(transcript);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private bool TranscriptExists(int id)
    {
        return _context.Transcripts.Any(t => t.Id == id);
    }
}

public class TranscriptStatsDto
{
    public int TotalTranscripts { get; set; }
    public int PassedCount { get; set; }
    public int FailedCount { get; set; }
    public double PassRate { get; set; }
    public decimal AverageGrade { get; set; }
    public decimal AverageGpa { get; set; }
}
