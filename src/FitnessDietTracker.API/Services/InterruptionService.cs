using FitnessDietTracker.API.Data;
using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Enums;
using FitnessDietTracker.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessDietTracker.API.Services;

public class InterruptionService : IInterruptionService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public InterruptionService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<List<CheckInInterruptionDto>> GetAllAsync(int? coachId, int? userId)
    {
        var query = _context.CheckInInterruptions
            .Include(i => i.User)
                .ThenInclude(u => u.Coach)
            .Include(i => i.Logs)
            .AsQueryable();

        if (coachId.HasValue)
            query = query.Where(i => i.User.CoachId == coachId.Value);
        if (userId.HasValue)
            query = query.Where(i => i.UserId == userId.Value);

        var interruptions = await query
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        var result = new List<CheckInInterruptionDto>();
        foreach (var i in interruptions)
        {
            var dto = await MapToDtoAsync(i);
            result.Add(dto);
        }
        return result;
    }

    public async Task<CheckInInterruptionDto?> GetByIdAsync(int id)
    {
        var interruption = await _context.CheckInInterruptions
            .Include(i => i.User)
                .ThenInclude(u => u.Coach)
            .Include(i => i.Logs)
            .FirstOrDefaultAsync(i => i.Id == id);

        return interruption != null ? await MapToDtoAsync(interruption) : null;
    }

    public async Task<CheckInInterruptionDto> HandleAsync(int id, HandleInterruptionDto dto)
    {
        var interruption = await _context.CheckInInterruptions
            .Include(i => i.User)
                .ThenInclude(u => u.Coach)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (interruption == null)
            throw new KeyNotFoundException($"中断记录 {id} 不存在");

        var operatorUser = await _context.Users.FindAsync(dto.OperatorId);
        var operatorName = operatorUser?.UserName ?? "未知操作者";

        var oldStatus = interruption.Status;
        interruption.Reason = dto.Reason;
        interruption.ActionTaken = dto.ActionTaken;

        if (dto.NewStatus.HasValue)
        {
            interruption.Status = dto.NewStatus.Value;
            if (dto.NewStatus.Value == InterruptionStatus.Closed ||
                dto.NewStatus.Value == InterruptionStatus.Resolved)
            {
                interruption.ClosedAt = DateTime.UtcNow;
                interruption.ClosedBy = dto.OperatorId;
                interruption.EndDate = DateTime.UtcNow;
            }
        }

        interruption.UpdatedAt = DateTime.UtcNow;

        var actionType = dto.NewStatus.HasValue
            ? $"状态变更: {oldStatus} → {dto.NewStatus.Value}"
            : "更新处理信息";

        var log = new InterruptionLog
        {
            InterruptionId = id,
            ActionType = actionType,
            Reason = dto.Reason,
            ActionTaken = dto.ActionTaken,
            ClosedAt = interruption.ClosedAt,
            OperatorId = dto.OperatorId,
            CreatedAt = DateTime.UtcNow,
            Remarks = dto.Remarks
        };
        _context.InterruptionLogs.Add(log);

        await _context.SaveChangesAsync();

        var notificationTitle = $"打卡中断处理：{interruption.User.UserName}";
        var notificationContent = $"操作者：{operatorName}\n处理动作：{dto.ActionTaken}\n原因：{dto.Reason}\n当前状态：{interruption.Status}";

        if (interruption.User.CoachId.HasValue && interruption.User.CoachId.Value != dto.OperatorId)
        {
            await _notificationService.CreateAsync(new CreateNotificationDto
            {
                UserId = interruption.User.CoachId.Value,
                Type = NotificationType.CheckInInterruption,
                Title = notificationTitle,
                Content = notificationContent,
                RelatedId = interruption.Id,
                RelatedType = "CheckInInterruption",
                CreatedBy = dto.OperatorId
            });
        }

        if (interruption.UserId != dto.OperatorId)
        {
            await _notificationService.CreateAsync(new CreateNotificationDto
            {
                UserId = interruption.UserId,
                Type = NotificationType.CheckInInterruption,
                Title = $"您的打卡中断已处理",
                Content = $"教练 {operatorName} 已处理您的打卡中断。\n处理动作：{dto.ActionTaken}\n原因说明：{dto.Reason}",
                RelatedId = interruption.Id,
                RelatedType = "CheckInInterruption",
                CreatedBy = dto.OperatorId
            });
        }

        return await MapToDtoAsync(interruption);
    }

    private async Task<CheckInInterruptionDto> MapToDtoAsync(CheckInInterruption i)
    {
        var operatorIds = i.Logs?.Select(l => l.OperatorId).Where(id => id.HasValue && id.Value > 0).Distinct().Select(id => id.Value).ToList()
            ?? new List<int>();

        var operatorUsers = await _context.Users
            .Where(u => operatorIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.UserName);

        return new CheckInInterruptionDto
        {
            Id = i.Id,
            UserId = i.UserId,
            UserName = i.User?.UserName ?? string.Empty,
            CoachId = i.User?.CoachId,
            CoachName = i.User?.Coach?.UserName,
            StartDate = i.StartDate,
            EndDate = i.EndDate,
            MissedDays = i.MissedDays,
            Status = i.Status,
            Reason = i.Reason,
            ActionTaken = i.ActionTaken,
            ClosedAt = i.ClosedAt,
            ClosedBy = i.ClosedBy,
            Logs = i.Logs?.Select(l => new InterruptionLogDto
            {
                Id = l.Id,
                ActionType = l.ActionType,
                Reason = l.Reason,
                ActionTaken = l.ActionTaken,
                ClosedAt = l.ClosedAt,
                OperatorId = l.OperatorId,
                OperatorName = !l.OperatorId.HasValue
                    ? "系统"
                    : operatorUsers.ContainsKey(l.OperatorId.Value) ? operatorUsers[l.OperatorId.Value] : "未知",
                CreatedAt = l.CreatedAt,
                Remarks = l.Remarks
            }).ToList() ?? new()
        };
    }
}
