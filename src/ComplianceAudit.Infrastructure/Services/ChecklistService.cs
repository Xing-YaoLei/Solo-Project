using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;

namespace ComplianceAudit.Infrastructure.Services;

public class ChecklistService : IChecklistService
{
    private readonly IUnitOfWork _unitOfWork;

    public ChecklistService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task GenerateChecklistFromTemplateAsync(long scheduleId, long templateId)
    {
        var template = await _unitOfWork.ChecklistTemplates.GetByIdAsync(templateId)
            ?? throw new KeyNotFoundException($"Template {templateId} not found");

        var schedule = await _unitOfWork.AuditSchedules.GetByIdAsync(scheduleId)
            ?? throw new KeyNotFoundException($"Schedule {scheduleId} not found");

        var templateItems = await _unitOfWork.ChecklistTemplateItems
            .FindAsync(ti => ti.TemplateId == templateId && !ti.IsDeleted);

        var checklistItems = templateItems.Select(ti => new ChecklistItem
        {
            ScheduleId = scheduleId,
            TemplateItemId = ti.Id,
            ItemNo = ti.ItemNo,
            Content = ti.Content,
            RiskLevel = ti.RiskLevel,
            EvidenceRequirements = ti.EvidenceRequirements,
            SortOrder = ti.SortOrder,
            Status = CheckStatus.Pending,
            EvidenceStatus = EvidenceStatus.Missing,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        await _unitOfWork.ChecklistItems.AddRangeAsync(checklistItems);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<ChecklistItem>> GetChecklistByScheduleIdAsync(long scheduleId)
    {
        var result = await _unitOfWork.ChecklistItems
            .FindAsync(ci => ci.ScheduleId == scheduleId && !ci.IsDeleted);
        return result.OrderBy(ci => ci.SortOrder).ToList();
    }

    public async Task<ChecklistItem?> GetChecklistItemByIdAsync(long id)
    {
        return await _unitOfWork.ChecklistItems.GetByIdAsync(id);
    }

    public async Task<ChecklistItem> UpdateChecklistItemAsync(ChecklistItem item, long currentUserId)
    {
        var existing = await _unitOfWork.ChecklistItems.GetByIdAsync(item.Id)
            ?? throw new KeyNotFoundException($"ChecklistItem {item.Id} not found");

        var oldStatus = existing.Status;

        existing.Content = item.Content;
        existing.RiskLevel = item.RiskLevel;
        existing.EvidenceRequirements = item.EvidenceRequirements;
        existing.IsCompliant = item.IsCompliant;
        existing.Findings = item.Findings;
        existing.AuditNotes = item.AuditNotes;
        existing.Status = item.Status;
        existing.EvidenceStatus = item.EvidenceStatus;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = currentUserId;

        if (item.IsCompliant.HasValue && !existing.CheckedAt.HasValue)
        {
            existing.CheckedAt = DateTime.UtcNow;
            existing.CheckedBy = currentUserId;
        }

        _unitOfWork.ChecklistItems.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        await RecordProcessingHistory(
            nameof(ChecklistItem), existing.Id,
            "Updated", "更新检查项",
            oldStatus, existing.Status,
            currentUserId, AuditRole.Auditor);

        return existing;
    }

    public async Task UpdateChecklistItemStatusAsync(long itemId, CheckStatus status, long currentUserId, string? notes = null)
    {
        var item = await _unitOfWork.ChecklistItems.GetByIdAsync(itemId)
            ?? throw new KeyNotFoundException($"ChecklistItem {itemId} not found");

        var oldStatus = item.Status;
        item.Status = status;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = currentUserId;

        if (status == CheckStatus.Reviewed)
        {
            item.ReviewedAt = DateTime.UtcNow;
            item.ReviewedBy = currentUserId;
        }

        _unitOfWork.ChecklistItems.Update(item);
        await _unitOfWork.SaveChangesAsync();

        await RecordProcessingHistory(
            nameof(ChecklistItem), itemId,
            $"StatusChangedTo{status}", notes ?? $"状态变更为 {status}",
            oldStatus, status,
            currentUserId, AuditRole.Auditor);
    }

    public async Task BulkUpdateChecklistItemsStatusAsync(IEnumerable<long> itemIds, CheckStatus status, long currentUserId, string? batchId = null)
    {
        var batchIdValue = batchId ?? $"BATCH-{DateTime.UtcNow:yyyyMMddHHmmss}";
        var items = await _unitOfWork.ChecklistItems.FindAsync(ci => itemIds.Contains(ci.Id));

        foreach (var item in items)
        {
            var oldStatus = item.Status;
            item.Status = status;
            item.UpdatedAt = DateTime.UtcNow;
            item.UpdatedBy = currentUserId;

            if (status == CheckStatus.Reviewed)
            {
                item.ReviewedAt = DateTime.UtcNow;
                item.ReviewedBy = currentUserId;
            }

            _unitOfWork.ChecklistItems.Update(item);

            await RecordProcessingHistory(
                nameof(ChecklistItem), item.Id,
                $"BulkStatusChangedTo{status}", $"批量更新状态为 {status}",
                oldStatus, status,
                currentUserId, AuditRole.Auditor, batchIdValue);
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task SetChecklistItemResultAsync(long itemId, bool isCompliant, string? findings, long currentUserId)
    {
        var item = await _unitOfWork.ChecklistItems.GetByIdAsync(itemId)
            ?? throw new KeyNotFoundException($"ChecklistItem {itemId} not found");

        var oldStatus = item.Status;
        item.IsCompliant = isCompliant;
        item.Findings = findings;
        item.CheckedAt = DateTime.UtcNow;
        item.CheckedBy = currentUserId;
        item.Status = CheckStatus.InProgress;
        item.UpdatedAt = DateTime.UtcNow;
        item.UpdatedBy = currentUserId;

        _unitOfWork.ChecklistItems.Update(item);
        await _unitOfWork.SaveChangesAsync();

        await RecordProcessingHistory(
            nameof(ChecklistItem), itemId,
            "ResultSet", $"检查结果: {(isCompliant ? "合规" : "不合规")}, 发现: {findings}",
            oldStatus, CheckStatus.InProgress,
            currentUserId, AuditRole.Auditor);
    }

    public async Task RecordProcessingHistory(
        string entityType, long entityId, string actionType, string description,
        CheckStatus? fromStatus, CheckStatus? toStatus,
        long operatorId, AuditRole operatorRole, string? batchId = null)
    {
        var history = new ProcessingHistory
        {
            EntityType = entityType,
            EntityId = entityId,
            ActionType = actionType,
            Description = description,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            OperatorId = operatorId,
            OperatorRole = operatorRole,
            OperatedAt = DateTime.UtcNow,
            BatchId = batchId,
            SourceReference = $"{entityType}/{entityId}",
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.ProcessingHistories.AddAsync(history);
        await _unitOfWork.SaveChangesAsync();
    }
}
