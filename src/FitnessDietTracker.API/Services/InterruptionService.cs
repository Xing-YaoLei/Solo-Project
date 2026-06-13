using FitnessDietTracker.API.Data;
using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Enums;
using FitnessDietTracker.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessDietTracker.API.Services;

public class InterruptionService : IInterruptionService
{
    private readonly AppDbContext _context;

    public InterruptionService(AppDbContext context)
    {
        _context = context;
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

        return await query
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => MapToDto(i))
            .ToListAsync();
    }

    public async Task<CheckInInterruptionDto?> GetByIdAsync(int id)
    {
        var interruption = await _context.CheckInInterruptions
            .Include(i => i.User)
                .ThenInclude(u => u.Coach)
            .Include(i => i.Logs)
            .FirstOrDefaultAsync(i => i.Id == id);

        return interruption != null ? MapToDto(interruption) : null;
    }

    public async Task<CheckInInterruptionDto> HandleAsync(int id, HandleInterruptionDto dto)
    {
        var interruption = await _context.CheckInInterruptions
            .Include(i => i.User)
                .ThenInclude(u => u.Coach)
            .Include(i => i.Logs)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (interruption == null)
            throw new KeyNotFoundException($"中断记录 {id} 不存在");

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

        var log = new InterruptionLog
        {
            InterruptionId = id,
            ActionType = dto.NewStatus.HasValue ? $"状态变更为 {dto.NewStatus.Value}" : "更新处理信息",
            Reason = dto.Reason,
            ActionTaken = dto.ActionTaken,
            ClosedAt = interruption.ClosedAt,
            OperatorId = dto.OperatorId,
            CreatedAt = DateTime.UtcNow,
            Remarks = dto.Remarks
        };
        _context.InterruptionLogs.Add(log);

        await _context.SaveChangesAsync();
        return MapToDto(interruption);
    }

    private static CheckInInterruptionDto MapToDto(CheckInInterruption i) => new()
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
            OperatorName = string.Empty,
            CreatedAt = l.CreatedAt,
            Remarks = l.Remarks
        }).ToList() ?? new()
    };
}
