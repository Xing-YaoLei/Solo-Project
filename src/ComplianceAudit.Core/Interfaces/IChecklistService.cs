using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Interfaces;

public interface IChecklistService
{
    Task GenerateChecklistFromTemplateAsync(long scheduleId, long templateId);
    Task<IEnumerable<ChecklistItem>> GetChecklistByScheduleIdAsync(long scheduleId);
    Task<ChecklistItem?> GetChecklistItemByIdAsync(long id);
    Task<ChecklistItem> UpdateChecklistItemAsync(ChecklistItem item, long currentUserId);
    Task UpdateChecklistItemStatusAsync(long itemId, CheckStatus status, long currentUserId, string? notes = null);
    Task BulkUpdateChecklistItemsStatusAsync(IEnumerable<long> itemIds, CheckStatus status, long currentUserId, string? batchId = null);
    Task SetChecklistItemResultAsync(long itemId, bool isCompliant, string? findings, long currentUserId);
    Task RecordProcessingHistory(string entityType, long entityId, string actionType, string description,
        CheckStatus? fromStatus, CheckStatus? toStatus, long operatorId, AuditRole operatorRole, string? batchId = null);
}
