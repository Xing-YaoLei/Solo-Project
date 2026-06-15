using Microsoft.EntityFrameworkCore;
using CertSchedulePlatform.Data;
using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.Services;

public class ProgressAlertService : IProgressAlertService
{
    private readonly AppDbContext _context;

    public ProgressAlertService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ProgressAlertDto>> GetAlertsAsync(AlertQueryDto query)
    {
        var q = _context.ProgressAlerts
            .Include(a => a.User)
            .Include(a => a.LearningProgress)
                .ThenInclude(lp => lp.Certificate)
            .Include(a => a.LearningProgress)
                .ThenInclude(lp => lp.Course)
            .Include(a => a.ResolvedBy)
            .AsQueryable();

        if (query.UserId.HasValue)
            q = q.Where(a => a.UserId == query.UserId.Value);

        if (query.Status.HasValue)
            q = q.Where(a => a.Status == query.Status.Value);

        if (query.Severity.HasValue)
            q = q.Where(a => a.Severity == query.Severity.Value);

        if (query.StartDate.HasValue)
            q = q.Where(a => a.CreatedAt >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            q = q.Where(a => a.CreatedAt <= query.EndDate.Value);

        var totalCount = await q.CountAsync();

        var items = await q
            .OrderByDescending(a => a.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(a => new ProgressAlertDto
            {
                Id = a.Id,
                LearningProgressId = a.LearningProgressId,
                UserId = a.UserId,
                UserName = a.User != null ? a.User.FullName ?? a.User.Username : null,
                CertificateName = a.LearningProgress != null && a.LearningProgress.Certificate != null ? a.LearningProgress.Certificate.Name : null,
                CourseName = a.LearningProgress != null && a.LearningProgress.Course != null ? a.LearningProgress.Course.Name : null,
                AlertType = a.AlertType,
                AlertTypeText = GetAlertTypeText(a.AlertType),
                Severity = a.Severity,
                SeverityText = GetSeverityText(a.Severity),
                CurrentRate = a.CurrentRate,
                ExpectedRate = a.ExpectedRate,
                BehindRate = a.BehindRate,
                Message = a.Message,
                Status = a.Status,
                StatusText = GetAlertStatusText(a.Status),
                Reason = a.Reason,
                ActionTaken = a.ActionTaken,
                ResolvedAt = a.ResolvedAt,
                ResolvedByUserId = a.ResolvedByUserId,
                ResolvedByName = a.ResolvedBy != null ? a.ResolvedBy.FullName ?? a.ResolvedBy.Username : null,
                CreatedAt = a.CreatedAt,
                ClosedAt = a.ClosedAt
            })
            .ToListAsync();

        return new PagedResult<ProgressAlertDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<ProgressAlertDto?> GetByIdAsync(int id)
    {
        var alert = await _context.ProgressAlerts
            .Include(a => a.User)
            .Include(a => a.LearningProgress)
                .ThenInclude(lp => lp.Certificate)
            .Include(a => a.LearningProgress)
                .ThenInclude(lp => lp.Course)
            .Include(a => a.ResolvedBy)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (alert == null) return null;

        return new ProgressAlertDto
        {
            Id = alert.Id,
            LearningProgressId = alert.LearningProgressId,
            UserId = alert.UserId,
            UserName = alert.User != null ? alert.User.FullName ?? alert.User.Username : null,
            CertificateName = alert.LearningProgress != null && alert.LearningProgress.Certificate != null ? alert.LearningProgress.Certificate.Name : null,
            CourseName = alert.LearningProgress != null && alert.LearningProgress.Course != null ? alert.LearningProgress.Course.Name : null,
            AlertType = alert.AlertType,
            AlertTypeText = GetAlertTypeText(alert.AlertType),
            Severity = alert.Severity,
            SeverityText = GetSeverityText(alert.Severity),
            CurrentRate = alert.CurrentRate,
            ExpectedRate = alert.ExpectedRate,
            BehindRate = alert.BehindRate,
            Message = alert.Message,
            Status = alert.Status,
            StatusText = GetAlertStatusText(alert.Status),
            Reason = alert.Reason,
            ActionTaken = alert.ActionTaken,
            ResolvedAt = alert.ResolvedAt,
            ResolvedByUserId = alert.ResolvedByUserId,
            ResolvedByName = alert.ResolvedBy != null ? alert.ResolvedBy.FullName ?? alert.ResolvedBy.Username : null,
            CreatedAt = alert.CreatedAt,
            ClosedAt = alert.ClosedAt
        };
    }

    public async Task<List<ProgressAlertDto>> GetActiveAlertsByUserAsync(int userId)
    {
        return await _context.ProgressAlerts
            .Include(a => a.LearningProgress)
                .ThenInclude(lp => lp.Certificate)
            .Include(a => a.LearningProgress)
                .ThenInclude(lp => lp.Course)
            .Where(a => a.UserId == userId && a.Status != AlertStatus.Closed && a.Status != AlertStatus.Ignored)
            .OrderByDescending(a => a.Severity)
            .ThenByDescending(a => a.CreatedAt)
            .Select(a => new ProgressAlertDto
            {
                Id = a.Id,
                LearningProgressId = a.LearningProgressId,
                UserId = a.UserId,
                CertificateName = a.LearningProgress != null && a.LearningProgress.Certificate != null ? a.LearningProgress.Certificate.Name : null,
                CourseName = a.LearningProgress != null && a.LearningProgress.Course != null ? a.LearningProgress.Course.Name : null,
                AlertType = a.AlertType,
                AlertTypeText = GetAlertTypeText(a.AlertType),
                Severity = a.Severity,
                SeverityText = GetSeverityText(a.Severity),
                CurrentRate = a.CurrentRate,
                ExpectedRate = a.ExpectedRate,
                BehindRate = a.BehindRate,
                Message = a.Message,
                Status = a.Status,
                StatusText = GetAlertStatusText(a.Status),
                CreatedAt = a.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<ProgressAlertDto?> HandleAlertAsync(int id, AlertHandleDto dto)
    {
        var alert = await _context.ProgressAlerts.FindAsync(id);
        if (alert == null) return null;

        alert.Reason = dto.Reason;
        alert.ActionTaken = dto.ActionTaken;
        alert.Status = dto.NewStatus;

        if (dto.NewStatus == AlertStatus.Resolved || dto.NewStatus == AlertStatus.Closed)
        {
            alert.ResolvedAt = DateTime.UtcNow;
            alert.ResolvedByUserId = dto.HandlerUserId;
            if (dto.NewStatus == AlertStatus.Closed)
            {
                alert.ClosedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<int> CheckAndCreateAlertsAsync()
    {
        var createdCount = 0;
        var now = DateTime.UtcNow;

        var inProgressItems = await _context.LearningProgresses
            .Where(lp => lp.Status == ProgressStatus.InProgress || lp.Status == ProgressStatus.Behind)
            .Where(lp => lp.StartDate.HasValue && lp.TargetDate.HasValue)
            .ToListAsync();

        foreach (var progress in inProgressItems)
        {
            var totalDays = (progress.TargetDate!.Value - progress.StartDate!.Value).TotalDays;
            var elapsedDays = (now - progress.StartDate.Value).TotalDays;

            if (elapsedDays <= 0 || totalDays <= 0) continue;

            var expectedRate = Math.Min(100, (decimal)(elapsedDays / totalDays * 100));
            var behindRate = expectedRate - progress.CompletionRate;

            if (behindRate > 10)
            {
                var existingOpenAlert = await _context.ProgressAlerts
                    .Where(a => a.LearningProgressId == progress.Id
                        && a.AlertType == AlertType.ProgressBehind
                        && (a.Status == AlertStatus.Open || a.Status == AlertStatus.InProgress))
                    .FirstOrDefaultAsync();

                if (existingOpenAlert == null)
                {
                    var severity = behindRate switch
                    {
                        > 30 => AlertSeverity.Critical,
                        > 20 => AlertSeverity.High,
                        > 15 => AlertSeverity.Medium,
                        _ => AlertSeverity.Low
                    };

                    var alert = new ProgressAlert
                    {
                        LearningProgressId = progress.Id,
                        UserId = progress.UserId,
                        AlertType = AlertType.ProgressBehind,
                        Severity = severity,
                        CurrentRate = progress.CompletionRate,
                        ExpectedRate = Math.Round(expectedRate, 1),
                        BehindRate = Math.Round(behindRate, 1),
                        Message = $"学习进度落后{Math.Round(behindRate, 1)}%，当前{progress.CompletionRate}%，预期{Math.Round(expectedRate, 1)}%",
                        Status = AlertStatus.Open,
                        CreatedAt = now
                    };

                    _context.ProgressAlerts.Add(alert);
                    progress.Status = ProgressStatus.Behind;
                    createdCount++;
                }
                else
                {
                    existingOpenAlert.CurrentRate = progress.CompletionRate;
                    existingOpenAlert.ExpectedRate = Math.Round(expectedRate, 1);
                    existingOpenAlert.BehindRate = Math.Round(behindRate, 1);
                }
            }
        }

        if (createdCount > 0)
            await _context.SaveChangesAsync();

        return createdCount;
    }

    public async Task<int> GetOpenAlertCountAsync(int? userId = null)
    {
        var query = _context.ProgressAlerts
            .Where(a => a.Status == AlertStatus.Open || a.Status == AlertStatus.InProgress);

        if (userId.HasValue)
            query = query.Where(a => a.UserId == userId.Value);

        return await query.CountAsync();
    }

    private static string GetAlertTypeText(AlertType type)
    {
        return type switch
        {
            AlertType.ProgressBehind => "进度落后",
            AlertType.DeadlineApproaching => "即将截止",
            AlertType.NoActivity => "无学习活动",
            AlertType.ScoreDrop => "成绩下滑",
            _ => "未知"
        };
    }

    private static string GetSeverityText(AlertSeverity severity)
    {
        return severity switch
        {
            AlertSeverity.Low => "低",
            AlertSeverity.Medium => "中",
            AlertSeverity.High => "高",
            AlertSeverity.Critical => "严重",
            _ => "未知"
        };
    }

    private static string GetAlertStatusText(AlertStatus status)
    {
        return status switch
        {
            AlertStatus.Open => "待处理",
            AlertStatus.InProgress => "处理中",
            AlertStatus.Resolved => "已解决",
            AlertStatus.Closed => "已关闭",
            AlertStatus.Ignored => "已忽略",
            _ => "未知"
        };
    }
}
