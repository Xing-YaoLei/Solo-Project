using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;

namespace ComplianceAudit.Infrastructure.Services;

public class EvidenceMissingService : IEvidenceMissingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IChecklistService _checklistService;

    public EvidenceMissingService(IUnitOfWork unitOfWork, IChecklistService checklistService)
    {
        _unitOfWork = unitOfWork;
        _checklistService = checklistService;
    }

    public async Task<EvidenceMissingRecord> CreateEvidenceMissingRecordAsync(EvidenceMissingRecord record, long currentUserId)
    {
        record.MissingNo = $"EVM-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
        record.Status = EvidenceStatus.Missing;
        record.RequestedAt = DateTime.UtcNow;
        record.RequestedById = currentUserId;
        record.CreatedAt = DateTime.UtcNow;
        record.CreatedBy = currentUserId;

        var created = await _unitOfWork.EvidenceMissingRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(EvidenceMissingRecord), created.Id,
            "Created", $"创建证据缺失记录: {record.MissingDescription}",
            null, CheckStatus.Pending,
            currentUserId, AuditRole.Auditor);

        var checkRecord = await _unitOfWork.CheckRecords.GetByIdAsync(record.CheckRecordId);
        if (checkRecord != null)
        {
            checkRecord.EvidenceStatus = EvidenceStatus.Missing;
            checkRecord.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.CheckRecords.Update(checkRecord);
            await _unitOfWork.SaveChangesAsync();
        }

        return created;
    }

    public async Task<EvidenceMissingRecord?> GetEvidenceMissingByIdAsync(long id)
    {
        return await _unitOfWork.EvidenceMissingRecords.GetByIdAsync(id);
    }

    public async Task<IEnumerable<EvidenceMissingRecord>> GetByCheckRecordIdAsync(long checkRecordId)
    {
        return await _unitOfWork.EvidenceMissingRecords
            .FindAsync(emr => emr.CheckRecordId == checkRecordId && !emr.IsDeleted);
    }

    public async Task<IEnumerable<EvidenceMissingRecord>> GetByScheduleIdAsync(long scheduleId)
    {
        var checkRecords = await _unitOfWork.CheckRecords
            .FindAsync(cr => cr.ScheduleId == scheduleId && !cr.IsDeleted);
        var checkRecordIds = checkRecords.Select(cr => cr.Id).ToList();

        return await _unitOfWork.EvidenceMissingRecords
            .FindAsync(emr => checkRecordIds.Contains(emr.CheckRecordId) && !emr.IsDeleted);
    }

    public async Task<(IEnumerable<EvidenceMissingRecord> Items, int TotalCount)> GetEvidenceMissingRecordsAsync(
        int pageNumber, int pageSize,
        EvidenceStatus? status, long? responsibleId, bool myAssigned, long? currentUserId)
    {
        return await _unitOfWork.EvidenceMissingRecords.GetPagedAsync(
            pageNumber, pageSize,
            predicate: emr => !emr.IsDeleted
                && (!status.HasValue || emr.Status == status.Value)
                && (!responsibleId.HasValue || emr.ResponsibleId == responsibleId.Value)
                && (!myAssigned || !currentUserId.HasValue || emr.ResponsibleId == currentUserId.Value),
            orderBy: q => q.OrderByDescending(emr => emr.CreatedAt));
    }

    public async Task RequestSupplementAsync(long id, string description, long responsibleId, DateTime deadline, long currentUserId)
    {
        var record = await _unitOfWork.EvidenceMissingRecords.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"EvidenceMissingRecord {id} not found");

        var oldStatus = record.Status;
        record.Status = EvidenceStatus.SupplementRequested;
        record.EvidenceRequired = description;
        record.ResponsibleId = responsibleId;
        record.Deadline = deadline;
        record.UpdatedAt = DateTime.UtcNow;
        record.UpdatedBy = currentUserId;

        _unitOfWork.EvidenceMissingRecords.Update(record);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(EvidenceMissingRecord), id,
            "SupplementRequested", $"请求补充证据: {description}, 责任人ID: {responsibleId}, 截止: {deadline:yyyy-MM-dd}",
            null, CheckStatus.InProgress,
            currentUserId, AuditRole.Auditor);
    }

    public async Task ProvideEvidenceAsync(long id, string supplierComments, IEnumerable<Evidence> evidences, long currentUserId)
    {
        var record = await _unitOfWork.EvidenceMissingRecords.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"EvidenceMissingRecord {id} not found");

        var oldStatus = record.Status;
        record.Status = EvidenceStatus.SupplementProvided;
        record.SupplierComments = supplierComments;
        record.SuppliedAt = DateTime.UtcNow;
        record.UpdatedAt = DateTime.UtcNow;
        record.UpdatedBy = currentUserId;

        _unitOfWork.EvidenceMissingRecords.Update(record);

        foreach (var evidence in evidences)
        {
            evidence.EvidenceMissingRecordId = id;
            evidence.IsSupplement = true;
            evidence.CreatedAt = DateTime.UtcNow;
            evidence.CreatedBy = currentUserId;
            await _unitOfWork.Evidences.AddAsync(evidence);
        }

        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(EvidenceMissingRecord), id,
            "SupplementProvided", $"提供补充证据: {supplierComments}, 共{evidences.Count()}个文件",
            null, CheckStatus.Submitted,
            currentUserId, AuditRole.BusinessOwner);
    }

    public async Task ReviewSuppliedEvidenceAsync(long id, EvidenceStatus newStatus, string reviewerComments, long currentUserId)
    {
        var record = await _unitOfWork.EvidenceMissingRecords.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"EvidenceMissingRecord {id} not found");

        var oldStatus = record.Status;
        record.Status = newStatus;
        record.ReviewerComments = reviewerComments;
        record.UpdatedAt = DateTime.UtcNow;
        record.UpdatedBy = currentUserId;

        _unitOfWork.EvidenceMissingRecords.Update(record);

        if (newStatus == EvidenceStatus.Complete)
        {
            var checkRecord = await _unitOfWork.CheckRecords.GetByIdAsync(record.CheckRecordId);
            if (checkRecord != null)
            {
                checkRecord.EvidenceStatus = EvidenceStatus.Complete;
                checkRecord.UpdatedAt = DateTime.UtcNow;
                _unitOfWork.CheckRecords.Update(checkRecord);
            }
        }

        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(EvidenceMissingRecord), id,
            $"ReviewedAs{newStatus}",
            newStatus == EvidenceStatus.Complete ? $"证据复核通过: {reviewerComments}" : $"证据复核未通过: {reviewerComments}",
            null, CheckStatus.Reviewed,
            currentUserId, AuditRole.ComplianceOfficer);
    }

    public async Task WaiveEvidenceRequirementAsync(long id, string waiveReason, long currentUserId)
    {
        var record = await _unitOfWork.EvidenceMissingRecords.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"EvidenceMissingRecord {id} not found");

        var oldStatus = record.Status;
        record.Status = EvidenceStatus.Waived;
        record.IsWaived = true;
        record.WaiveReason = waiveReason;
        record.UpdatedAt = DateTime.UtcNow;
        record.UpdatedBy = currentUserId;

        _unitOfWork.EvidenceMissingRecords.Update(record);

        var checkRecord = await _unitOfWork.CheckRecords.GetByIdAsync(record.CheckRecordId);
        if (checkRecord != null)
        {
            checkRecord.EvidenceStatus = EvidenceStatus.Waived;
            checkRecord.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.CheckRecords.Update(checkRecord);
        }

        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(EvidenceMissingRecord), id,
            "Waived", $"豁免证据要求: {waiveReason}",
            null, CheckStatus.Closed,
            currentUserId, AuditRole.Management);
    }
}
