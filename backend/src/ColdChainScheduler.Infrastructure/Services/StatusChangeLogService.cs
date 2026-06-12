using ColdChainScheduler.Domain.Entities;
using ColdChainScheduler.Domain.Interfaces;
using ColdChainScheduler.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ColdChainScheduler.Infrastructure.Services;

public class StatusChangeLogService : IStatusChangeLogService
{
    private readonly AppDbContext _context;

    public StatusChangeLogService(AppDbContext context)
    {
        _context = context;
    }

    public async Task LogStatusChange(string entityType, int entityId, string? oldStatus, string newStatus, string? changedBy, string? reason)
    {
        var log = new StatusChangeLog
        {
            EntityType = entityType,
            EntityId = entityId,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            ChangedBy = changedBy,
            ChangedAt = DateTime.UtcNow,
            Reason = reason
        };
        _context.StatusChangeLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<StatusChangeLog>> GetEntityHistoryAsync(string entityType, int entityId)
    {
        return await _context.StatusChangeLogs
            .Where(s => s.EntityType == entityType && s.EntityId == entityId)
            .OrderByDescending(s => s.ChangedAt)
            .ToListAsync();
    }
}
