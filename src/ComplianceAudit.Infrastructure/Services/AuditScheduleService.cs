using Microsoft.EntityFrameworkCore;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;

namespace ComplianceAudit.Infrastructure.Services;

public class AuditScheduleService : IAuditScheduleService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IChecklistService _checklistService;

    public AuditScheduleService(IUnitOfWork unitOfWork, IChecklistService checklistService)
    {
        _unitOfWork = unitOfWork;
        _checklistService = checklistService;
    }

    public async Task<AuditSchedule> CreateScheduleAsync(AuditSchedule schedule, long currentUserId)
    {
        schedule.CreatedAt = DateTime.UtcNow;
        schedule.CreatedBy = currentUserId;
        schedule.Status = CheckStatus.Pending;
        schedule.ScheduleNo = $"SCH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";

        var created = await _unitOfWork.AuditSchedules.AddAsync(schedule);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(AuditSchedule), created.Id,
            "Created", $"创建排程: {schedule.Title}",
            null, CheckStatus.Pending,
            currentUserId, AuditRole.Auditor);

        return created;
    }

    public async Task<AuditSchedule?> GetScheduleByIdAsync(long id)
    {
        return await _unitOfWork.AuditSchedules
            .FindAsync(s => s.Id == id && !s.IsDeleted)
            as AuditSchedule;
    }

    public async Task<(IEnumerable<AuditSchedule> Items, int TotalCount)> GetSchedulesAsync(
        int pageNumber, int pageSize,
        long? auditorId, long? businessOwnerId,
        CheckStatus? status, RiskLevel? riskLevel,
        DateTime? startDateFrom, DateTime? startDateTo)
    {
        return await _unitOfWork.AuditSchedules.GetPagedAsync(
            pageNumber, pageSize,
            predicate: s => !s.IsDeleted
                && (!auditorId.HasValue || s.AuditorId == auditorId.Value)
                && (!businessOwnerId.HasValue || s.BusinessOwnerId == businessOwnerId.Value)
                && (!status.HasValue || s.Status == status.Value)
                && (!riskLevel.HasValue || s.RiskLevel == riskLevel.Value)
                && (!startDateFrom.HasValue || s.StartDate >= startDateFrom.Value)
                && (!startDateTo.HasValue || s.StartDate <= startDateTo.Value),
            orderBy: q => q.OrderByDescending(s => s.CreatedAt),
            includeProperties: "Regulation,Auditor,BusinessOwner");
    }

    public async Task<AuditSchedule> UpdateScheduleAsync(AuditSchedule schedule, long currentUserId)
    {
        var existing = await _unitOfWork.AuditSchedules.GetByIdAsync(schedule.Id)
            ?? throw new KeyNotFoundException($"Schedule {schedule.Id} not found");

        var oldStatus = existing.Status;

        existing.Title = schedule.Title;
        existing.Description = schedule.Description;
        existing.RegulationId = schedule.RegulationId;
        existing.AuditorId = schedule.AuditorId;
        existing.BusinessOwnerId = schedule.BusinessOwnerId;
        existing.Frequency = schedule.Frequency;
        existing.StartDate = schedule.StartDate;
        existing.EndDate = schedule.EndDate;
        existing.DueDate = schedule.DueDate;
        existing.RiskLevel = schedule.RiskLevel;
        existing.Scope = schedule.Scope;
        existing.Remarks = schedule.Remarks;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = currentUserId;

        _unitOfWork.AuditSchedules.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(AuditSchedule), existing.Id,
            "Updated", "更新排程信息",
            oldStatus, existing.Status,
            currentUserId, AuditRole.Auditor);

        return existing;
    }

    public async Task DeleteScheduleAsync(long id, long currentUserId)
    {
        var existing = await _unitOfWork.AuditSchedules.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Schedule {id} not found");

        existing.IsDeleted = true;
        existing.UpdatedAt = DateTime.UtcNow;
        existing.UpdatedBy = currentUserId;

        _unitOfWork.AuditSchedules.Update(existing);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(AuditSchedule), id,
            "Deleted", "删除排程",
            existing.Status, null,
            currentUserId, AuditRole.Auditor);
    }

    public async Task StartScheduleAsync(long scheduleId, long currentUserId)
    {
        var schedule = await _unitOfWork.AuditSchedules.GetByIdAsync(scheduleId)
            ?? throw new KeyNotFoundException($"Schedule {scheduleId} not found");

        var oldStatus = schedule.Status;
        schedule.Status = CheckStatus.InProgress;
        schedule.UpdatedAt = DateTime.UtcNow;
        schedule.UpdatedBy = currentUserId;

        _unitOfWork.AuditSchedules.Update(schedule);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(AuditSchedule), scheduleId,
            "Started", "开始检查排程",
            oldStatus, CheckStatus.InProgress,
            currentUserId, AuditRole.Auditor);
    }

    public async Task SubmitScheduleAsync(long scheduleId, long currentUserId)
    {
        var schedule = await _unitOfWork.AuditSchedules.GetByIdAsync(scheduleId)
            ?? throw new KeyNotFoundException($"Schedule {scheduleId} not found");

        var oldStatus = schedule.Status;
        schedule.Status = CheckStatus.Submitted;
        schedule.UpdatedAt = DateTime.UtcNow;
        schedule.UpdatedBy = currentUserId;

        _unitOfWork.AuditSchedules.Update(schedule);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(AuditSchedule), scheduleId,
            "Submitted", "提交排程待复核",
            oldStatus, CheckStatus.Submitted,
            currentUserId, AuditRole.Auditor);
    }

    public async Task ReviewScheduleAsync(long scheduleId, long currentUserId, bool approved, string comments)
    {
        var schedule = await _unitOfWork.AuditSchedules.GetByIdAsync(scheduleId)
            ?? throw new KeyNotFoundException($"Schedule {scheduleId} not found");

        var oldStatus = schedule.Status;
        schedule.Status = approved ? CheckStatus.Approved : CheckStatus.Rejected;
        schedule.UpdatedAt = DateTime.UtcNow;
        schedule.UpdatedBy = currentUserId;

        _unitOfWork.AuditSchedules.Update(schedule);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(AuditSchedule), scheduleId,
            approved ? "Approved" : "Rejected",
            approved ? $"排程复核通过: {comments}" : $"排程复核拒绝: {comments}",
            oldStatus, schedule.Status,
            currentUserId, AuditRole.ComplianceOfficer);
    }

    public async Task CloseScheduleAsync(long scheduleId, long currentUserId)
    {
        var schedule = await _unitOfWork.AuditSchedules.GetByIdAsync(scheduleId)
            ?? throw new KeyNotFoundException($"Schedule {scheduleId} not found");

        var oldStatus = schedule.Status;
        schedule.Status = CheckStatus.Closed;
        schedule.UpdatedAt = DateTime.UtcNow;
        schedule.UpdatedBy = currentUserId;

        _unitOfWork.AuditSchedules.Update(schedule);
        await _unitOfWork.SaveChangesAsync();

        await _checklistService.RecordProcessingHistory(
            nameof(AuditSchedule), scheduleId,
            "Closed", "关闭排程",
            oldStatus, CheckStatus.Closed,
            currentUserId, AuditRole.Management);
    }

    public async Task<IEnumerable<AuditSchedule>> GetMySchedulesAsync(long userId, AuditRole role)
    {
        var schedules = await _unitOfWork.AuditSchedules.FindAsync(s => !s.IsDeleted);
        return role switch
        {
            AuditRole.Auditor => schedules.Where(s => s.AuditorId == userId),
            AuditRole.BusinessOwner => schedules.Where(s => s.BusinessOwnerId == userId),
            _ => schedules
        };
    }
}
