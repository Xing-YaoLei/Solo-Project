using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;

namespace ComplianceAudit.Infrastructure.Services;

public class SamplingService : ISamplingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IChecklistService _checklistService;

    public SamplingService(IUnitOfWork unitOfWork, IChecklistService checklistService)
    {
        _unitOfWork = unitOfWork;
        _checklistService = checklistService;
    }

    public async Task<IEnumerable<SamplingRecord>> CreateSamplingRecordsAsync(
        long scheduleId, IEnumerable<SamplingRecord> records, long currentUserId)
    {
        var recordList = records.ToList();
        var counter = 1;

        foreach (var record in recordList)
        {
            record.ScheduleId = scheduleId;
            record.SamplingNo = $"SMP-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 6).ToUpper()}-{counter:D4}";
            record.Status = CheckStatus.Pending;
            record.CreatedAt = DateTime.UtcNow;
            record.CreatedBy = currentUserId;
            counter++;
        }

        var created = await _unitOfWork.SamplingRecords.AddRangeAsync(recordList);
        await _unitOfWork.SaveChangesAsync();

        foreach (var record in created)
        {
            await _checklistService.RecordProcessingHistory(
                nameof(SamplingRecord), record.Id,
                "Created", $"创建抽样记录: {record.DocumentNo}",
                null, CheckStatus.Pending,
                currentUserId, AuditRole.Auditor);
        }

        return created;
    }

    public async Task<SamplingRecord?> GetSamplingByIdAsync(long id)
    {
        return await _unitOfWork.SamplingRecords.GetByIdAsync(id);
    }

    public async Task<(IEnumerable<SamplingRecord> Items, int TotalCount)> GetSamplingByScheduleIdAsync(
        long scheduleId, int pageNumber, int pageSize,
        CheckStatus? status, string? documentType, string? keyword)
    {
        return await _unitOfWork.SamplingRecords.GetPagedAsync(
            pageNumber, pageSize,
            predicate: sr => sr.ScheduleId == scheduleId && !sr.IsDeleted
                && (!status.HasValue || sr.Status == status.Value)
                && (string.IsNullOrEmpty(documentType) || sr.DocumentType == documentType)
                && (string.IsNullOrEmpty(keyword)
                    || sr.DocumentNo.Contains(keyword)
                    || sr.Description!.Contains(keyword)
                    || sr.BatchNo!.Contains(keyword)),
            orderBy: q => q.OrderByDescending(sr => sr.CreatedAt));
    }

    public async Task<SamplingRecord> UpdateSamplingAsync(SamplingRecord record, long currentUserId)
    {
        var existing = await _unitOfWork.SamplingRecords.GetByIdAsync(record.Id)
            ?? throw new KeyNotFoundException($"SamplingRecord {record.Id} not found");

        var oldStatus = existing.Status;

        existing.SourceSystem = record.SourceSystem;
        existing.SourceModule = record.SourceModule;
        existing.DocumentNo = record.DocumentNo;
        existing.DocumentType = record.DocumentType;
        existing.DocumentDate = record.DocumentDate;
        existing.Department = record.Department;
        existing.BusinessOwner = record.BusinessOwner;
        existing.Description = record.Description;
        existing.RiskLevel = record.RiskLevel;
        existing.Status = record.Status;
        existing.SamplingReason = record.SamplingReason;
        existing.BatchNo = record.BatchNo;
        existing.Amount = record.Amount;
        existing.Currency = record.Currency;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = currentUserId;

        _unitOfWork.SamplingRecords.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(SamplingRecord), existing.Id,
            "Updated", "更新抽样记录",
            oldStatus, existing.Status,
            currentUserId, AuditRole.Auditor);

        return existing;
    }

    public async Task DeleteSamplingAsync(long id, long currentUserId)
    {
        var existing = await _unitOfWork.SamplingRecords.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"SamplingRecord {id} not found");

        existing.IsDeleted = true;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = currentUserId;

        _unitOfWork.SamplingRecords.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(SamplingRecord), id,
            "Deleted", "删除抽样记录",
            existing.Status, null,
            currentUserId, AuditRole.Auditor);
    }

    public async Task BulkUpdateSamplingStatusAsync(IEnumerable<long> ids, CheckStatus status, long currentUserId, string? batchId = null)
    {
        var batchIdValue = batchId ?? $"BATCH-{DateTime.UtcNow:yyyyMMddHHmmss}";
        var records = await _unitOfWork.SamplingRecords.FindAsync(sr => ids.Contains(sr.Id) && !sr.IsDeleted);

        foreach (var record in records)
        {
            var oldStatus = record.Status;
            record.Status = status;
            record.UpdatedAt = DateTime.UtcNow;
            record.UpdatedBy = currentUserId;

            _unitOfWork.SamplingRecords.Update(record);

            await _checklistService.RecordProcessingHistory(
                nameof(SamplingRecord), record.Id,
                $"BulkStatusChangedTo{status}", $"批量更新抽样状态为 {status}",
                oldStatus, status,
                currentUserId, AuditRole.Auditor, batchIdValue);
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<SamplingRecord>> GetAllSamplingByScheduleIdAsync(long scheduleId)
    {
        return await _unitOfWork.SamplingRecords
            .FindAsync(sr => sr.ScheduleId == scheduleId && !sr.IsDeleted);
    }
}
