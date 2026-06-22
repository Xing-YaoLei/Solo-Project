using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;

namespace ComplianceAudit.Infrastructure.Services;

public class RectificationService : IRectificationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IChecklistService _checklistService;

    public RectificationService(IUnitOfWork unitOfWork, IChecklistService checklistService)
    {
        _unitOfWork = unitOfWork;
        _checklistService = checklistService;
    }

    public async Task<Rectification> CreateRectificationAsync(Rectification rectification, long currentUserId)
    {
        rectification.RectificationNo = $"RECT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
        rectification.Status = RectificationStatus.NotStarted;
        rectification.CreatedAt = DateTime.UtcNow;
        rectification.CreatedBy = currentUserId;

        var created = await _unitOfWork.Rectifications.AddAsync(rectification);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(Rectification), created.Id,
            "Created", $"创建整改计划: {rectification.Title}",
            null, CheckStatus.Pending,
            currentUserId, AuditRole.Auditor);

        return created;
    }

    public async Task<Rectification?> GetRectificationByIdAsync(long id)
    {
        return await _unitOfWork.Rectifications.GetByIdAsync(id);
    }

    public async Task<(IEnumerable<Rectification> Items, int TotalCount)> GetRectificationsAsync(
        int pageNumber, int pageSize,
        long? scheduleId, long? ownerId,
        RectificationStatus? status, RiskLevel? riskLevel,
        bool myAssigned, long? currentUserId)
    {
        return await _unitOfWork.Rectifications.GetPagedAsync(
            pageNumber, pageSize,
            predicate: r => !r.IsDeleted
                && (!scheduleId.HasValue || r.ScheduleId == scheduleId.Value)
                && (!ownerId.HasValue || r.OwnerId == ownerId.Value)
                && (!status.HasValue || r.Status == status.Value)
                && (!riskLevel.HasValue || r.RiskLevel == riskLevel.Value)
                && (!myAssigned || !currentUserId.HasValue || r.OwnerId == currentUserId.Value),
            orderBy: q => q.OrderByDescending(r => r.CreatedAt),
            includeProperties: "Owner,Schedule");
    }

    public async Task<IEnumerable<Rectification>> GetRectificationsByScheduleIdAsync(long scheduleId)
    {
        return await _unitOfWork.Rectifications
            .FindAsync(r => r.ScheduleId == scheduleId && !r.IsDeleted);
    }

    public async Task<Rectification> UpdateRectificationAsync(Rectification rectification, long currentUserId)
    {
        var existing = await _unitOfWork.Rectifications.GetByIdAsync(rectification.Id)
            ?? throw new KeyNotFoundException($"Rectification {rectification.Id} not found");

        var oldStatus = existing.Status;

        existing.Title = rectification.Title;
        existing.Description = rectification.Description;
        existing.RootCause = rectification.RootCause;
        existing.ActionPlan = rectification.ActionPlan;
        existing.OwnerId = rectification.OwnerId;
        existing.Deadline = rectification.Deadline;
        existing.RiskLevel = rectification.RiskLevel;
        existing.CorrectiveAction = rectification.CorrectiveAction;
        existing.PreventiveAction = rectification.PreventiveAction;
        existing.Remarks = rectification.Remarks;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = currentUserId;

        _unitOfWork.Rectifications.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(Rectification), existing.Id,
            "Updated", "更新整改计划",
            null, CheckStatus.InProgress,
            currentUserId, AuditRole.BusinessOwner);

        return existing;
    }

    public async Task UpdateStatusAsync(long id, RectificationStatus status, long currentUserId, string? comments = null)
    {
        var rectification = await _unitOfWork.Rectifications.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Rectification {id} not found");

        rectification.Status = status;
        rectification.UpdatedAt = DateTime.UtcNow;
        rectification.UpdatedBy = currentUserId;

        if (status == RectificationStatus.InProgress)
        {
            rectification.CompletedAt = null;
        }

        _unitOfWork.Rectifications.Update(rectification);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(Rectification), id,
            $"StatusChangedTo{status}", comments ?? $"状态变更为 {status}",
            null, (CheckStatus?)Enum.Parse(typeof(CheckStatus), status.ToString()),
            currentUserId, AuditRole.BusinessOwner);
    }

    public async Task SubmitForReviewAsync(long id, long currentUserId)
    {
        var rectification = await _unitOfWork.Rectifications.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Rectification {id} not found");

        rectification.Status = RectificationStatus.SubmittedForReview;
        rectification.CompletedAt = DateTime.UtcNow;
        rectification.UpdatedAt = DateTime.UtcNow;
        rectification.UpdatedBy = currentUserId;

        _unitOfWork.Rectifications.Update(rectification);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(Rectification), id,
            "SubmittedForReview", "整改完成，提交复核",
            null, CheckStatus.Submitted,
            currentUserId, AuditRole.BusinessOwner);
    }

    public async Task VerifyAsync(long id, string verificationResult, bool isVerified, long currentUserId)
    {
        var rectification = await _unitOfWork.Rectifications.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Rectification {id} not found");

        rectification.Status = isVerified ? RectificationStatus.Verified : RectificationStatus.InProgress;
        rectification.VerificationResult = verificationResult;
        rectification.VerifiedAt = isVerified ? DateTime.UtcNow : null;
        rectification.VerifiedBy = isVerified ? currentUserId : null;
        rectification.UpdatedAt = DateTime.UtcNow;
        rectification.UpdatedBy = currentUserId;

        _unitOfWork.Rectifications.Update(rectification);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(Rectification), id,
            isVerified ? "Verified" : "VerificationFailed",
            isVerified ? $"整改验证通过: {verificationResult}" : $"整改验证未通过: {verificationResult}",
            null, isVerified ? CheckStatus.Approved : CheckStatus.Rejected,
            currentUserId, AuditRole.ComplianceOfficer);
    }

    public async Task CloseAsync(long id, long currentUserId)
    {
        var rectification = await _unitOfWork.Rectifications.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Rectification {id} not found");

        rectification.Status = RectificationStatus.Closed;
        rectification.UpdatedAt = DateTime.UtcNow;
        rectification.UpdatedBy = currentUserId;

        _unitOfWork.Rectifications.Update(rectification);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(Rectification), id,
            "Closed", "整改计划关闭",
            null, CheckStatus.Closed,
            currentUserId, AuditRole.Management);
    }

    public async Task CheckOverdueRectifications()
    {
        var now = DateTime.UtcNow;
        var overdueRectifications = await _unitOfWork.Rectifications
            .FindAsync(r => !r.IsDeleted
                && r.Status != RectificationStatus.Closed
                && r.Status != RectificationStatus.Verified
                && r.Deadline < now);

        foreach (var rectification in overdueRectifications)
        {
            if (rectification.Status != RectificationStatus.Overdue)
            {
                rectification.Status = RectificationStatus.Overdue;
                rectification.UpdatedAt = now;
                _unitOfWork.Rectifications.Update(rectification);

                await _checklistService.RecordProcessingHistory(
                    nameof(Rectification), rectification.Id,
                    "MarkedOverdue", $"整改计划已逾期, 截止日期: {rectification.Deadline:yyyy-MM-dd}",
                    null, CheckStatus.Rejected,
                    -1, AuditRole.Management, "HANGFIRE-JOB");
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }
}
