using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using EduSchedule.API.Data;
using EduSchedule.API.Models;
using EduSchedule.API.Services;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConflictsController : ControllerBase
{
    private readonly IConflictDetectionService _conflictService;
    private readonly AppDbContext _context;

    public ConflictsController(IConflictDetectionService conflictService, AppDbContext context)
    {
        _conflictService = conflictService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<Conflict>>> GetConflicts(
        [FromQuery] ConflictStatus? status,
        [FromQuery] ConflictLevel? level,
        [FromQuery] int? semesterId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken)
    {
        var query = _context.Conflicts
            .Include(c => c.Classroom)
            .Include(c => c.Schedule1)
                .ThenInclude(s => s!.Course)
            .Include(c => c.Schedule1)
                .ThenInclude(s => s!.Classroom)
            .Include(c => c.Schedule2)
                .ThenInclude(s => s!.Course)
            .Include(c => c.Schedule2)
                .ThenInclude(s => s!.Classroom)
            .Include(c => c.AssignedToUser)
            .Include(c => c.Teacher1)
            .Include(c => c.Teacher2)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(c => c.Status == status.Value);

        if (level.HasValue)
            query = query.Where(c => c.Level == level.Value);

        if (semesterId.HasValue)
            query = query.Where(c => c.Schedule1!.SemesterId == semesterId.Value ||
                                     c.Schedule2!.SemesterId == semesterId.Value);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(c => c.Level)
            .ThenByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PaginatedResult<Conflict>(items, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Conflict>> GetConflict(int id, CancellationToken cancellationToken)
    {
        var conflict = await _context.Conflicts
            .Include(c => c.Classroom)
            .Include(c => c.Schedule1)
                .ThenInclude(s => s!.Course)
            .Include(c => c.Schedule1)
                .ThenInclude(s => s!.Classroom)
            .Include(c => c.Schedule1)
                .ThenInclude(s => s!.TimeSlot)
            .Include(c => c.Schedule2)
                .ThenInclude(s => s!.Course)
            .Include(c => c.Schedule2)
                .ThenInclude(s => s!.Classroom)
            .Include(c => c.Schedule2)
                .ThenInclude(s => s!.TimeSlot)
            .Include(c => c.AssignedToUser)
            .Include(c => c.Teacher1)
            .Include(c => c.Teacher2)
            .Include(c => c.Communications)
                .ThenInclude(c => c.User)
            .Include(c => c.Reviews)
                .ThenInclude(r => r.Reviewer)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (conflict == null) return NotFound();
        return Ok(conflict);
    }

    [HttpGet("{id}/communications")]
    public async Task<ActionResult<IEnumerable<ConflictCommunication>>> GetCommunications(int id, CancellationToken cancellationToken)
    {
        var communications = await _context.ConflictCommunications
            .Where(c => c.ConflictId == id)
            .Include(c => c.User)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(communications);
    }

    [HttpGet("{id}/reviews")]
    public async Task<ActionResult<IEnumerable<ConflictReview>>> GetReviews(int id, CancellationToken cancellationToken)
    {
        var reviews = await _context.ConflictReviews
            .Where(r => r.ConflictId == id)
            .Include(r => r.Reviewer)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(reviews);
    }

    [HttpPost("{id}/assign")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead")]
    public async Task<IActionResult> AssignTo(int id, [FromBody] AssignConflictRequest request, CancellationToken cancellationToken)
    {
        try
        {
            await _conflictService.AssignConflictToUserAsync(id, request.UserId, cancellationToken);
            return Ok(new { message = "已分配处理人" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/resolve")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<IActionResult> Resolve(int id, [FromBody] ResolveConflictRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

        try
        {
            await _conflictService.ResolveConflictAsync(id, userId, request.Resolution, cancellationToken);
            return Ok(new { message = "冲突已解决" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/communications")]
    public async Task<IActionResult> AddCommunication(int id, [FromBody] AddCommunicationRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

        try
        {
            await _conflictService.AddCommunicationAsync(id, userId, request.Message, request.Type, cancellationToken);
            return Ok(new { message = "消息已发送" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id}/reviews")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<IActionResult> AddReview(int id, [FromBody] AddReviewRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

        try
        {
            await _conflictService.AddReviewAsync(id, userId, request.Opinion, request.Result, request.Suggestions, cancellationToken);
            return Ok(new { message = "复核意见已提交" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("detect-all/{semesterId}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<ActionResult<IEnumerable<Conflict>>> DetectAll(int semesterId, CancellationToken cancellationToken)
    {
        var conflicts = await _conflictService.DetectAllConflictsAsync(semesterId, cancellationToken);
        return Ok(conflicts);
    }
}

public class AssignConflictRequest
{
    public int UserId { get; set; }
}

public class ResolveConflictRequest
{
    public string Resolution { get; set; } = string.Empty;
}

public class AddCommunicationRequest
{
    public string Message { get; set; } = string.Empty;
    public CommunicationType Type { get; set; } = CommunicationType.Comment;
}

public class AddReviewRequest
{
    public string Opinion { get; set; } = string.Empty;
    public ReviewResult Result { get; set; }
    public string? Suggestions { get; set; }
}
