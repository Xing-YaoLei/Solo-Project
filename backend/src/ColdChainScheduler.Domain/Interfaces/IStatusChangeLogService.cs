using ColdChainScheduler.Domain.Entities;

namespace ColdChainScheduler.Domain.Interfaces;

public interface IStatusChangeLogService
{
    Task LogStatusChange(string entityType, int entityId, string? oldStatus, string newStatus, string? changedBy, string? reason);
    Task<IEnumerable<StatusChangeLog>> GetEntityHistoryAsync(string entityType, int entityId);
}
