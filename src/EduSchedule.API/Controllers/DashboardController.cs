using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Data;
using EduSchedule.API.Enums;
using EduSchedule.API.Services;

namespace EduSchedule.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IApprovalService _approvalService;
    private readonly IConflictDetectionService _conflictService;

    public DashboardController(AppDbContext context, IApprovalService approvalService, IConflictDetectionService conflictService)
    {
        _context = context;
        _approvalService = approvalService;
        _conflictService = conflictService;
    }

    [HttpGet("overview")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<ActionResult<DashboardOverviewDto>> GetOverview(CancellationToken cancellationToken)
    {
        var currentSemester = await _context.Semesters.FirstOrDefaultAsync(s => s.IsCurrent, cancellationToken);
        int? semesterId = currentSemester?.Id;

        var totalCourses = semesterId.HasValue
            ? await _context.Courses.CountAsync(c => c.SemesterId == semesterId.Value, cancellationToken)
            : await _context.Courses.CountAsync(cancellationToken);

        var totalClassrooms = await _context.Classrooms.CountAsync(c => c.IsActive, cancellationToken);
        var totalStudents = await _context.Students.CountAsync(s => s.IsActive, cancellationToken);
        var totalTeachers = await _context.Users.CountAsync(u => u.IsActive && (u.Role == RoleType.Teacher || u.Role == RoleType.DepartmentHead), cancellationToken);

        var pendingSchedules = semesterId.HasValue
            ? await _context.CourseSchedules.CountAsync(s => s.SemesterId == semesterId.Value && s.ApprovalStatus == ApprovalStatus.Pending, cancellationToken)
            : 0;

        var approvedSchedules = semesterId.HasValue
            ? await _context.CourseSchedules.CountAsync(s => s.SemesterId == semesterId.Value && s.ApprovalStatus == ApprovalStatus.Approved, cancellationToken)
            : 0;

        var pendingConflicts = await _context.Conflicts.CountAsync(c => c.Status != ConflictStatus.Resolved && c.Status != ConflictStatus.Rejected, cancellationToken);
        var highConflicts = await _context.Conflicts.CountAsync(c => (c.Level == ConflictLevel.Critical || c.Level == ConflictLevel.High)
            && c.Status != ConflictStatus.Resolved && c.Status != ConflictStatus.Rejected, cancellationToken);

        var approvalStats = await _approvalService.GetApprovalStatisticsAsync(null, null, cancellationToken);

        return Ok(new DashboardOverviewDto
        {
            CurrentSemester = currentSemester != null ? $"{currentSemester.AcademicYear}-{currentSemester.Type}" : null,
            TotalCourses = totalCourses,
            TotalClassrooms = totalClassrooms,
            TotalStudents = totalStudents,
            TotalTeachers = totalTeachers,
            PendingSchedules = pendingSchedules,
            ApprovedSchedules = approvedSchedules,
            PendingConflicts = pendingConflicts,
            HighRiskConflicts = highConflicts,
            ApprovalRate = approvalStats.ApprovalRate,
            AverageApprovalHours = approvalStats.AverageApprovalHours,
            TotalPendingApprovals = approvalStats.PendingCount
        });
    }

    [HttpGet("approval-trend")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<ActionResult<IEnumerable<ApprovalTrendDto>>> GetApprovalTrend([FromQuery] int days = 30, CancellationToken cancellationToken)
    {
        var trend = await _approvalService.GetApprovalTrendAsync(days, cancellationToken);
        return Ok(trend);
    }

    [HttpGet("conflict-summary")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<ActionResult<ConflictSummaryDto>> GetConflictSummary(CancellationToken cancellationToken)
    {
        var conflicts = await _conflictService.GetConflictsAsync(null, null, null, cancellationToken);
        var grouped = conflicts.GroupBy(c => c.Level)
            .Select(g => new { Level = g.Key, Count = g.Count() })
            .ToDictionary(g => g.Level, g => g.Count);

        var statusGrouped = conflicts.GroupBy(c => c.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionary(g => g.Status, g => g.Count);

        var typeGrouped = conflicts.GroupBy(c => c.Type)
            .Select(g => new { Type = g.Key, Count = g.Count() })
            .ToDictionary(g => g.Type, g => g.Count);

        return Ok(new ConflictSummaryDto
        {
            TotalConflicts = conflicts.Count(),
            ByLevel = new Dictionary<string, int>
            {
                ["Critical"] = grouped.TryGetValue(ConflictLevel.Critical, out var c) ? c : 0,
                ["High"] = grouped.TryGetValue(ConflictLevel.High, out var h) ? h : 0,
                ["Medium"] = grouped.TryGetValue(ConflictLevel.Medium, out var m) ? m : 0,
                ["Low"] = grouped.TryGetValue(ConflictLevel.Low, out var l) ? l : 0
            },
            ByStatus = new Dictionary<string, int>
            {
                ["Pending"] = statusGrouped.TryGetValue(ConflictStatus.Pending, out var p) ? p : 0,
                ["UnderReview"] = statusGrouped.TryGetValue(ConflictStatus.UnderReview, out var u) ? u : 0,
                ["Resolved"] = statusGrouped.TryGetValue(ConflictStatus.Resolved, out var r) ? r : 0,
                ["Escalated"] = statusGrouped.TryGetValue(ConflictStatus.Escalated, out var e) ? e : 0
            },
            ByType = new Dictionary<string, int>
            {
                ["ClassroomConflict"] = typeGrouped.TryGetValue(ConflictType.ClassroomConflict, out var cc) ? cc : 0,
                ["TeacherConflict"] = typeGrouped.TryGetValue(ConflictType.TeacherConflict, out var tc) ? tc : 0,
                ["Other"] = typeGrouped.Sum(kv => kv.Key != ConflictType.ClassroomConflict && kv.Key != ConflictType.TeacherConflict ? kv.Value : 0)
            }
        });
    }

    [HttpGet("recent-activity")]
    [Authorize(Roles = "Administrator,AcademicAffairs,DepartmentHead,Dean")]
    public async Task<ActionResult<IEnumerable<RecentActivityDto>>> GetRecentActivity(CancellationToken cancellationToken)
    {
        var activities = new List<RecentActivityDto>();

        var recentApprovals = await _context.ApprovalRecords
            .Include(r => r.Approver)
            .Include(r => r.Schedule)
                .ThenInclude(s => s.Course)
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        activities.AddRange(recentApprovals.Select(r => new RecentActivityDto
        {
            Type = "Approval",
            Title = $"{r.Approver.RealName} 审核了 {r.Schedule.Course.Name}",
            Status = r.Status.ToString(),
            CreatedAt = r.CreatedAt
        }));

        var recentConflicts = await _context.Conflicts
            .Include(c => c.Classroom)
            .OrderByDescending(c => c.CreatedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        activities.AddRange(recentConflicts.Select(c => new RecentActivityDto
        {
            Type = "Conflict",
            Title = c.Title,
            Status = c.Status.ToString(),
            Level = c.Level.ToString(),
            CreatedAt = c.CreatedAt
        }));

        return Ok(activities.OrderByDescending(a => a.CreatedAt).Take(20));
    }
}

public class DashboardOverviewDto
{
    public string? CurrentSemester { get; set; }
    public int TotalCourses { get; set; }
    public int TotalClassrooms { get; set; }
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int PendingSchedules { get; set; }
    public int ApprovedSchedules { get; set; }
    public int PendingConflicts { get; set; }
    public int HighRiskConflicts { get; set; }
    public double ApprovalRate { get; set; }
    public double? AverageApprovalHours { get; set; }
    public int TotalPendingApprovals { get; set; }
}

public class ConflictSummaryDto
{
    public int TotalConflicts { get; set; }
    public Dictionary<string, int> ByLevel { get; set; } = new();
    public Dictionary<string, int> ByStatus { get; set; } = new();
    public Dictionary<string, int> ByType { get; set; } = new();
}

public class RecentActivityDto
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Level { get; set; }
    public DateTime CreatedAt { get; set; }
}
