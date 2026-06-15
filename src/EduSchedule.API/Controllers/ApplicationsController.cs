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
public class ApplicationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ApplicationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResult<Application>>> GetApplications(
        [FromQuery] int? applicantId,
        [FromQuery] ApplicationType? applicationType,
        [FromQuery] ApplicationStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken)
    {
        var query = _context.Applications
            .Include(a => a.Applicant)
            .Include(a => a.Student)
            .Include(a => a.Course)
            .Include(a => a.Semester)
            .Include(a => a.Processor)
            .AsQueryable();

        if (applicantId.HasValue)
            query = query.Where(a => a.ApplicantId == applicantId.Value);

        if (applicationType.HasValue)
            query = query.Where(a => a.Type == applicationType.Value);

        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(a => a.Title.Contains(search) ||
                                     a.Description!.Contains(search) ||
                                     a.Applicant.RealName.Contains(search));

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return Ok(new PaginatedResult<Application>(items, total, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Application>> GetApplication(int id, CancellationToken cancellationToken)
    {
        var application = await _context.Applications
            .Include(a => a.Applicant)
            .Include(a => a.Student)
            .Include(a => a.Course)
            .Include(a => a.Semester)
            .Include(a => a.Processor)
            .Include(a => a.Attachments)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (application == null) return NotFound();
        return Ok(application);
    }

    [HttpGet("stats")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<ActionResult<ApplicationStatsDto>> GetStats(CancellationToken cancellationToken)
    {
        var totalApplications = await _context.Applications.CountAsync(cancellationToken);
        var pendingCount = await _context.Applications.CountAsync(a => a.Status == ApplicationStatus.Pending || a.Status == ApplicationStatus.UnderReview, cancellationToken);
        var approvedCount = await _context.Applications.CountAsync(a => a.Status == ApplicationStatus.Approved, cancellationToken);
        var rejectedCount = await _context.Applications.CountAsync(a => a.Status == ApplicationStatus.Rejected, cancellationToken);

        var stats = new ApplicationStatsDto
        {
            TotalApplications = totalApplications,
            PendingCount = pendingCount,
            ApprovedCount = approvedCount,
            RejectedCount = rejectedCount,
            ApprovalRate = totalApplications > 0 ? (double)approvedCount / totalApplications : 0,
            AverageProcessingHours = null
        };

        return Ok(stats);
    }

    [HttpPost]
    public async Task<ActionResult<Application>> PostApplication(Application application, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out int userId))
        {
            application.ApplicantId = userId;
        }

        application.Status = ApplicationStatus.Pending;
        application.CreatedAt = DateTime.UtcNow;

        _context.Applications.Add(application);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetApplication), new { id = application.Id }, application);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,AcademicAffairs")]
    public async Task<IActionResult> PutApplication(int id, Application application, CancellationToken cancellationToken)
    {
        if (id != application.Id) return BadRequest();

        _context.Entry(application).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ApplicationExists(id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> DeleteApplication(int id, CancellationToken cancellationToken)
    {
        var application = await _context.Applications.FindAsync(new object[] { id }, cancellationToken);
        if (application == null) return NotFound();

        _context.Applications.Remove(application);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> SubmitForApproval(int id, CancellationToken cancellationToken)
    {
        var application = await _context.Applications.FindAsync(new object[] { id }, cancellationToken);
        if (application == null) return NotFound();

        if (application.Status != ApplicationStatus.Draft)
            return BadRequest(new { message = "只有草稿状态可以提交" });

        application.Status = ApplicationStatus.Pending;
        application.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "已提交审核" });
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<IActionResult> Approve(int id, [FromBody] ApproveApplicationRequest request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications.FindAsync(new object[] { id }, cancellationToken);
        if (application == null) return NotFound();

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

        application.Status = ApplicationStatus.Approved;
        application.ProcessorId = userId;
        application.ProcessorComments = request.Comment;
        application.ProcessedAt = DateTime.UtcNow;
        application.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "审核通过" });
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<IActionResult> Reject(int id, [FromBody] RejectApplicationRequest request, CancellationToken cancellationToken)
    {
        var application = await _context.Applications.FindAsync(new object[] { id }, cancellationToken);
        if (application == null) return NotFound();

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out int userId)) return Unauthorized();

        application.Status = ApplicationStatus.Rejected;
        application.ProcessorId = userId;
        application.ProcessorComments = request.Comment;
        application.ProcessedAt = DateTime.UtcNow;
        application.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "审核拒绝" });
    }

    private bool ApplicationExists(int id)
    {
        return _context.Applications.Any(a => a.Id == id);
    }
}

public class ApplicationStatsDto
{
    public int TotalApplications { get; set; }
    public int PendingCount { get; set; }
    public int ApprovedCount { get; set; }
    public int RejectedCount { get; set; }
    public double ApprovalRate { get; set; }
    public double? AverageProcessingHours { get; set; }
}

public class ApproveApplicationRequest
{
    public string? Comment { get; set; }
}

public class RejectApplicationRequest
{
    public string Comment { get; set; } = string.Empty;
}
