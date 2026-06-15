using Microsoft.EntityFrameworkCore;
using EduSchedule.API.Data;
using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public class ApprovalService : IApprovalService
{
    private readonly AppDbContext _context;

    public ApprovalService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApprovalRecord> CreateApprovalRecordAsync(int scheduleId, int approverId, ApprovalStatus status, int level, string? comments = null, CancellationToken cancellationToken = default)
    {
        var approver = await _context.Users.FindAsync(new object[] { approverId }, cancellationToken);

        var record = new ApprovalRecord
        {
            ScheduleId = scheduleId,
            ApproverId = approverId,
            Status = status,
            Comments = comments,
            ApprovalLevel = level,
            RoleWhenApproved = approver?.Role.ToString(),
            SubmittedAt = status == ApprovalStatus.Pending ? DateTime.UtcNow : null,
            ApprovedAt = status == ApprovalStatus.Approved ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow
        };

        _context.ApprovalRecords.Add(record);
        await _context.SaveChangesAsync(cancellationToken);

        return record;
    }

    public async Task<IEnumerable<ApprovalRecord>> GetApprovalRecordsByScheduleIdAsync(int scheduleId, CancellationToken cancellationToken = default)
    {
        return await _context.ApprovalRecords
            .Where(r => r.ScheduleId == scheduleId)
            .Include(r => r.Approver)
            .OrderBy(r => r.ApprovalLevel)
            .ThenByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<ApprovalRecord>> GetPendingApprovalsAsync(int? approverId = null, int? level = null, CancellationToken cancellationToken = default)
    {
        var query = _context.ApprovalRecords
            .Where(r => r.Status == ApprovalStatus.Pending)
            .Include(r => r.Schedule)
                .ThenInclude(s => s.Course)
            .Include(r => r.Schedule)
                .ThenInclude(s => s.Classroom)
            .Include(r => r.Approver)
            .AsQueryable();

        if (approverId.HasValue)
            query = query.Where(r => r.ApproverId == approverId.Value);
        if (level.HasValue)
            query = query.Where(r => r.ApprovalLevel == level.Value);

        return await query
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<ApprovalStatisticsDto> GetApprovalStatisticsAsync(DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default)
    {
        startDate ??= DateTime.UtcNow.AddMonths(-3);
        endDate ??= DateTime.UtcNow;

        var records = await _context.ApprovalRecords
            .Where(r => r.CreatedAt >= startDate && r.CreatedAt <= endDate)
            .ToListAsync(cancellationToken);

        var schedules = await _context.CourseSchedules
            .Where(s => s.CreatedAt >= startDate && s.CreatedAt <= endDate)
            .ToListAsync(cancellationToken);

        var approvedRecords = records.Where(r => r.Status == ApprovalStatus.Approved);
        var pendingRecords = records.Where(r => r.Status == ApprovalStatus.Pending);
        var rejectedRecords = records.Where(r => r.Status == ApprovalStatus.Rejected);

        var avgApprovalTime = (double?)null;
        var approvalTimes = new List<double>();
        foreach (var record in approvedRecords)
        {
            if (record.SubmittedAt.HasValue && record.ApprovedAt.HasValue)
            {
                approvalTimes.Add((record.ApprovedAt.Value - record.SubmittedAt.Value).TotalHours);
            }
        }
        if (approvalTimes.Any())
        {
            avgApprovalTime = approvalTimes.Average();
        }

        return new ApprovalStatisticsDto
        {
            TotalSchedules = schedules.Count,
            TotalApprovals = records.Count,
            ApprovedCount = approvedRecords.Count(),
            PendingCount = pendingRecords.Count(),
            RejectedCount = rejectedRecords.Count(),
            ApprovalRate = records.Any() ? (double)approvedRecords.Count() / records.Count : 0,
            AverageApprovalHours = avgApprovalTime,
            MaxApprovalHours = approvalTimes.Any() ? approvalTimes.Max() : null,
            MinApprovalHours = approvalTimes.Any() ? approvalTimes.Min() : null,
            StartDate = startDate.Value,
            EndDate = endDate.Value
        };
    }

    public async Task<IEnumerable<ApprovalTrendDto>> GetApprovalTrendAsync(int days = 30, CancellationToken cancellationToken = default)
    {
        var startDate = DateTime.UtcNow.AddDays(-days).Date;
        var endDate = DateTime.UtcNow.Date;

        var records = await _context.ApprovalRecords
            .Where(r => r.CreatedAt >= startDate && r.CreatedAt <= endDate)
            .ToListAsync(cancellationToken);

        var trend = new List<ApprovalTrendDto>();
        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            var dayRecords = records.Where(r => r.CreatedAt.Date == date).ToList();
            var approved = dayRecords.Count(r => r.Status == ApprovalStatus.Approved);
            var pending = dayRecords.Count(r => r.Status == ApprovalStatus.Pending);
            var rejected = dayRecords.Count(r => r.Status == ApprovalStatus.Rejected);

            var dayApprovalTimes = new List<double>();
            foreach (var r in dayRecords.Where(r => r.Status == ApprovalStatus.Approved))
            {
                if (r.SubmittedAt.HasValue && r.ApprovedAt.HasValue)
                {
                    dayApprovalTimes.Add((r.ApprovedAt.Value - r.SubmittedAt.Value).TotalHours);
                }
            }

            trend.Add(new ApprovalTrendDto
            {
                Date = date,
                TotalCount = dayRecords.Count,
                ApprovedCount = approved,
                PendingCount = pending,
                RejectedCount = rejected,
                AverageApprovalHours = dayApprovalTimes.Any() ? dayApprovalTimes.Average() : null
            });
        }

        return trend;
    }

    public async Task<IEnumerable<TodoItemDto>> GetUserTodosAsync(int userId, RoleType role, CancellationToken cancellationToken = default)
    {
        var todos = new List<TodoItemDto>();

        var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
        if (user == null) return todos;

        var pendingConflicts = await _context.Conflicts
            .Where(c => c.AssignedTo == userId && c.Status != ConflictStatus.Resolved && c.Status != ConflictStatus.Rejected)
            .Include(c => c.Classroom)
            .Include(c => c.Schedule1)
                .ThenInclude(s => s!.Course)
            .OrderByDescending(c => c.Level)
            .ThenBy(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        foreach (var conflict in pendingConflicts)
        {
            todos.Add(new TodoItemDto
            {
                Id = conflict.Id,
                Type = TodoType.ConflictResolution,
                Title = conflict.Title,
                Description = conflict.Description,
                Priority = conflict.Level switch
                {
                    ConflictLevel.Critical => Priority.High,
                    ConflictLevel.High => Priority.High,
                    ConflictLevel.Medium => Priority.Medium,
                    _ => Priority.Low
                },
                Status = TodoStatus.Pending,
                CreatedAt = conflict.CreatedAt,
                RelatedUrl = $"/conflicts/{conflict.Id}",
                Level = conflict.Level.ToString()
            });
        }

        if (role == RoleType.DepartmentHead || role == RoleType.AcademicAffairs || role == RoleType.Dean || role == RoleType.Administrator)
        {
            var pendingSchedules = await _context.CourseSchedules
                .Where(s => s.ApprovalStatus == ApprovalStatus.Pending)
                .Include(s => s.Course)
                    .ThenInclude(c => c.Department)
                .Include(s => s.Classroom)
                .ToListAsync(cancellationToken);

            foreach (var schedule in pendingSchedules)
            {
                bool isInScope = true;
                if (role == RoleType.DepartmentHead && user.DepartmentId.HasValue)
                {
                    isInScope = schedule.Course.DepartmentId == user.DepartmentId.Value;
                }

                if (isInScope)
                {
                    todos.Add(new TodoItemDto
                    {
                        Id = schedule.Id,
                        Type = TodoType.ScheduleApproval,
                        Title = $"排课审核：{schedule.Course.Name}",
                        Description = $"教室: {schedule.Classroom.Name}",
                        Priority = Priority.Medium,
                        Status = TodoStatus.Pending,
                        CreatedAt = schedule.CreatedAt,
                        RelatedUrl = $"/schedules/{schedule.Id}"
                    });
                }
            }
        }

        if (role == RoleType.AcademicAffairs || role == RoleType.Dean || role == RoleType.Administrator)
        {
            var pendingApplications = await _context.Applications
                .Where(a => a.Status == ApplicationStatus.Pending || a.Status == ApplicationStatus.UnderReview)
                .Include(a => a.Applicant)
                .Include(a => a.Course)
                .ToListAsync(cancellationToken);

            foreach (var app in pendingApplications)
            {
                todos.Add(new TodoItemDto
                {
                    Id = app.Id,
                    Type = TodoType.ApplicationReview,
                    Title = $"申请审核：{app.Title}",
                    Description = $"申请人: {app.Applicant.RealName}",
                    Priority = Priority.Medium,
                    Status = TodoStatus.Pending,
                    CreatedAt = app.CreatedAt,
                    RelatedUrl = $"/applications/{app.Id}"
                });
            }
        }

        return todos.OrderByDescending(t => t.Priority).ThenBy(t => t.CreatedAt);
    }
}

public class ApprovalStatisticsDto
{
    public int TotalSchedules { get; set; }
    public int TotalApprovals { get; set; }
    public int ApprovedCount { get; set; }
    public int PendingCount { get; set; }
    public int RejectedCount { get; set; }
    public double ApprovalRate { get; set; }
    public double? AverageApprovalHours { get; set; }
    public double? MaxApprovalHours { get; set; }
    public double? MinApprovalHours { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class ApprovalTrendDto
{
    public DateTime Date { get; set; }
    public int TotalCount { get; set; }
    public int ApprovedCount { get; set; }
    public int PendingCount { get; set; }
    public int RejectedCount { get; set; }
    public double? AverageApprovalHours { get; set; }
}

public class TodoItemDto
{
    public int Id { get; set; }
    public TodoType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Priority Priority { get; set; }
    public TodoStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public string RelatedUrl { get; set; } = string.Empty;
    public string? Level { get; set; }
}

public enum TodoType
{
    ConflictResolution,
    ScheduleApproval,
    ApplicationReview,
    GradeEntry,
    Other
}

public enum Priority
{
    Low,
    Medium,
    High,
    Urgent
}

public enum TodoStatus
{
    Pending,
    InProgress,
    Completed
}
