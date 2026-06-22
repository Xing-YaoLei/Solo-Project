using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;

namespace ComplianceAudit.Infrastructure.Services;

public class CheckRecordService : ICheckRecordService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IChecklistService _checklistService;

    public CheckRecordService(IUnitOfWork unitOfWork, IChecklistService checklistService)
    {
        _unitOfWork = unitOfWork;
        _checklistService = checklistService;
    }

    public async Task<CheckRecord> CreateCheckRecordAsync(CheckRecord record, long currentUserId)
    {
        record.Status = CheckStatus.Pending;
        record.EvidenceStatus = EvidenceStatus.Missing;
        record.CreatedAt = DateTime.UtcNow;
        record.CreatedBy = currentUserId;
        record.SourceReference = record.ChecklistItemId.HasValue
            ? $"ChecklistItem/{record.ChecklistItemId.Value}"
            : record.SamplingRecordId.HasValue
                ? $"SamplingRecord/{record.SamplingRecordId.Value}"
                : $"Schedule/{record.ScheduleId}";

        var created = await _unitOfWork.CheckRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(CheckRecord), created.Id,
            "Created", $"创建检查记录, 来源: {created.SourceReference}",
            null, CheckStatus.Pending,
            currentUserId, AuditRole.Auditor);

        return created;
    }

    public async Task<CheckRecord?> GetCheckRecordByIdAsync(long id)
    {
        return await _unitOfWork.CheckRecords.GetByIdAsync(id);
    }

    public async Task<IEnumerable<CheckRecord>> GetCheckRecordsByScheduleIdAsync(long scheduleId)
    {
        return await _unitOfWork.CheckRecords
            .FindAsync(cr => cr.ScheduleId == scheduleId && !cr.IsDeleted);
    }

    public async Task<IEnumerable<CheckRecord>> GetCheckRecordsByChecklistItemIdAsync(long checklistItemId)
    {
        return await _unitOfWork.CheckRecords
            .FindAsync(cr => cr.ChecklistItemId == checklistItemId && !cr.IsDeleted);
    }

    public async Task<IEnumerable<CheckRecord>> GetCheckRecordsBySamplingIdAsync(long samplingId)
    {
        return await _unitOfWork.CheckRecords
            .FindAsync(cr => cr.SamplingRecordId == samplingId && !cr.IsDeleted);
    }

    public async Task<CheckRecord> UpdateCheckRecordAsync(CheckRecord record, long currentUserId)
    {
        var existing = await _unitOfWork.CheckRecords.GetByIdAsync(record.Id)
            ?? throw new KeyNotFoundException($"CheckRecord {record.Id} not found");

        var oldStatus = existing.Status;

        existing.Findings = record.Findings;
        existing.AuditNotes = record.AuditNotes;
        existing.BusinessResponse = record.BusinessResponse;
        existing.ReviewComments = record.ReviewComments;
        existing.IsCompliant = record.IsCompliant;
        existing.RiskLevel = record.RiskLevel;
        existing.EvidenceStatus = record.EvidenceStatus;
        existing.Status = record.Status;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = currentUserId;

        if (record.IsCompliant.HasValue && !existing.CheckedAt.HasValue)
        {
            existing.CheckedAt = DateTime.UtcNow;
            existing.CheckedBy = currentUserId;
        }

        _unitOfWork.CheckRecords.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(CheckRecord), existing.Id,
            "Updated", "更新检查记录",
            oldStatus, existing.Status,
            currentUserId, AuditRole.Auditor);

        return existing;
    }

    public async Task UpdateCheckRecordStatusAsync(long id, CheckStatus status, long currentUserId, string? comments = null)
    {
        var record = await _unitOfWork.CheckRecords.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"CheckRecord {id} not found");

        var oldStatus = record.Status;
        record.Status = status;
        record.UpdatedAt = DateTime.UtcNow;
        record.UpdatedBy = currentUserId;

        if (status == CheckStatus.Reviewed)
        {
            record.ReviewedAt = DateTime.UtcNow;
            record.ReviewedBy = currentUserId;
            record.ReviewComments = comments;
        }
        else if (status == CheckStatus.Approved)
        {
            record.ApprovedAt = DateTime.UtcNow;
            record.ApprovedBy = currentUserId;
        }

        _unitOfWork.CheckRecords.Update(record);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(CheckRecord), id,
            $"StatusChangedTo{status}", comments ?? $"状态变更为 {status}",
            oldStatus, status,
            currentUserId, AuditRole.ComplianceOfficer);
    }

    public async Task BulkUpdateCheckRecordStatusAsync(IEnumerable<long> ids, CheckStatus status, long currentUserId, string? batchId = null)
    {
        var batchIdValue = batchId ?? $"BATCH-{DateTime.UtcNow:yyyyMMddHHmmss}";
        var records = await _unitOfWork.CheckRecords.FindAsync(cr => ids.Contains(cr.Id) && !cr.IsDeleted);

        foreach (var record in records)
        {
            var oldStatus = record.Status;
            record.Status = status;
            record.UpdatedAt = DateTime.UtcNow;
            record.UpdatedBy = currentUserId;

            if (status == CheckStatus.Reviewed)
            {
                record.ReviewedAt = DateTime.UtcNow;
                record.ReviewedBy = currentUserId;
            }
            else if (status == CheckStatus.Approved)
            {
                record.ApprovedAt = DateTime.UtcNow;
                record.ApprovedBy = currentUserId;
            }

            _unitOfWork.CheckRecords.Update(record);

            await _checklistService.RecordProcessingHistory(
                nameof(CheckRecord), record.Id,
                $"BulkStatusChangedTo{status}", $"批量更新状态为 {status}",
                oldStatus, status,
                currentUserId, AuditRole.ComplianceOfficer, batchIdValue);
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task SubmitCheckRecordAsync(long id, long currentUserId)
    {
        var record = await _unitOfWork.CheckRecords.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"CheckRecord {id} not found");

        var oldStatus = record.Status;
        record.Status = CheckStatus.Submitted;
        record.SubmittedAt = DateTime.UtcNow;
        record.SubmittedBy = currentUserId;
        record.UpdatedAt = DateTime.UtcNow;
        record.UpdatedBy = currentUserId;

        _unitOfWork.CheckRecords.Update(record);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(CheckRecord), id,
            "Submitted", "提交检查记录待复核",
            oldStatus, CheckStatus.Submitted,
            currentUserId, AuditRole.Auditor);
    }

    public async Task ReviewCheckRecordAsync(long id, long currentUserId, bool approved, string reviewComments)
    {
        var record = await _unitOfWork.CheckRecords.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"CheckRecord {id} not found");

        var oldStatus = record.Status;
        record.Status = approved ? CheckStatus.Reviewed : CheckStatus.Rejected;
        record.ReviewedAt = DateTime.UtcNow;
        record.ReviewedBy = currentUserId;
        record.ReviewComments = reviewComments;
        record.UpdatedAt = DateTime.UtcNow;
        record.UpdatedBy = currentUserId;

        _unitOfWork.CheckRecords.Update(record);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(CheckRecord), id,
            approved ? "Reviewed" : "Rejected",
            approved ? $"复核通过: {reviewComments}" : $"复核拒绝: {reviewComments}",
            oldStatus, record.Status,
            currentUserId, AuditRole.ComplianceOfficer);
    }

    public async Task SetCheckRecordResultAsync(long id, bool isCompliant, string findings, RiskLevel riskLevel, long currentUserId)
    {
        var record = await _unitOfWork.CheckRecords.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"CheckRecord {id} not found");

        var oldStatus = record.Status;
        record.IsCompliant = isCompliant;
        record.Findings = findings;
        record.RiskLevel = riskLevel;
        record.CheckedAt = DateTime.UtcNow;
        record.CheckedBy = currentUserId;
        record.Status = CheckStatus.InProgress;
        record.UpdatedAt = DateTime.UtcNow;
        record.UpdatedBy = currentUserId;

        _unitOfWork.CheckRecords.Update(record);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(CheckRecord), id,
            "ResultSet", $"检查结果: {(isCompliant ? "合规" : "不合规")}, 风险等级: {riskLevel}",
            oldStatus, CheckStatus.InProgress,
            currentUserId, AuditRole.Auditor);
    }

    public async Task<IEnumerable<CheckRecord>> GetCheckRecordsByDocumentNoAsync(string documentNo)
    {
        var samplingRecords = await _unitOfWork.SamplingRecords
            .FindAsync(sr => sr.DocumentNo == documentNo && !sr.IsDeleted);
        var samplingIds = samplingRecords.Select(sr => sr.Id).ToList();

        return await _unitOfWork.CheckRecords
            .FindAsync(cr => samplingIds.Contains(cr.SamplingRecordId ?? -1) && !cr.IsDeleted);
    }
}
