using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Helpers;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Entities;
using HearingCalendar.Domain.Enums;
using HearingCalendar.Infrastructure.Data;
using HearingCalendar.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace HearingCalendar.Application.Services;

public class HearingService : IHearingService
{
    private readonly IRepository<HearingSchedule> _hearingRepo;
    private readonly IRepository<StatusChangeLog> _statusLogRepo;
    private readonly IRepository<CalendarSlot> _calendarSlotRepo;
    private readonly IRepository<CapacityRule> _capacityRuleRepo;
    private readonly AuditTrailRepository _auditTrailRepo;
    private readonly HearingCalendarDbContext _dbContext;

    public HearingService(
        IRepository<HearingSchedule> hearingRepo,
        IRepository<StatusChangeLog> statusLogRepo,
        IRepository<CalendarSlot> calendarSlotRepo,
        IRepository<CapacityRule> capacityRuleRepo,
        AuditTrailRepository auditTrailRepo,
        HearingCalendarDbContext dbContext)
    {
        _hearingRepo = hearingRepo;
        _statusLogRepo = statusLogRepo;
        _calendarSlotRepo = calendarSlotRepo;
        _capacityRuleRepo = capacityRuleRepo;
        _auditTrailRepo = auditTrailRepo;
        _dbContext = dbContext;
    }

    public async Task<HearingDetailResponse> GetByIdAsync(Guid id)
    {
        var hearing = await _dbContext.HearingSchedules
            .Include(h => h.Participants)
                .ThenInclude(p => p.User)
            .Include(h => h.Attachments)
            .Include(h => h.StatusLogs)
            .Include(h => h.Conflict)
            .FirstOrDefaultAsync(h => h.Id == id);

        if (hearing is null)
            throw new KeyNotFoundException($"Hearing {id} not found");

        return MapToDetailResponse(hearing);
    }

    public async Task<PagedResult<HearingListResponse>> GetListAsync(int page, int pageSize, HearingStatus? status = null, DateOnly? fromDate = null, DateOnly? toDate = null, string? courtRoom = null, bool? conflictFlagged = null)
    {
        var query = _dbContext.HearingSchedules.AsQueryable();

        if (status.HasValue)
            query = query.Where(h => h.Status == status.Value);
        if (fromDate.HasValue)
            query = query.Where(h => h.HearingDate >= fromDate.Value);
        if (toDate.HasValue)
            query = query.Where(h => h.HearingDate <= toDate.Value);
        if (!string.IsNullOrEmpty(courtRoom))
            query = query.Where(h => h.CourtRoom == courtRoom);
        if (conflictFlagged.HasValue)
            query = query.Where(h => h.IsConflictFlagged == conflictFlagged.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(h => h.HearingDate)
            .ThenBy(h => h.StartTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(MapToListResponse).ToList();
        return new PagedResult<HearingListResponse>(dtos, totalCount, page, pageSize);
    }

    public async Task<HearingDetailResponse> CreateAsync(CreateHearingRequest request, Guid userId)
    {
        await ValidateCapacityInternalAsync(request.HearingDate, request.CourtRoom);

        var hearing = new HearingSchedule
        {
            CaseNumber = request.CaseNumber,
            CaseName = request.CaseName,
            CourtName = request.CourtName,
            CourtRoom = request.CourtRoom,
            HearingDate = request.HearingDate,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            Status = HearingStatus.Draft,
            IsConflictFlagged = false,
            CreatedBy = userId,
            AssignedLawyerId = request.AssignedLawyerId,
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _hearingRepo.AddAsync(hearing);

        await _statusLogRepo.AddAsync(new StatusChangeLog
        {
            HearingId = created.Id,
            FromStatus = HearingStatus.Draft,
            ToStatus = HearingStatus.Draft,
            ChangedBy = userId,
            Reason = "Created"
        });

        var slots = await _calendarSlotRepo.FindAsync(s => s.Date == request.HearingDate && s.CourtRoom == request.CourtRoom);
        var slot = slots.FirstOrDefault();
        if (slot is not null)
        {
            slot.CurrentCount++;
            await _calendarSlotRepo.UpdateAsync(slot);
        }

        await _auditTrailRepo.LogAsync(nameof(HearingSchedule), created.Id, "Create", userId);

        return await GetByIdAsync(created.Id);
    }

    public async Task<HearingDetailResponse> UpdateAsync(Guid id, UpdateHearingRequest request, Guid userId)
    {
        var hearing = await _hearingRepo.GetByIdAsync(id);
        if (hearing is null)
            throw new KeyNotFoundException($"Hearing {id} not found");

        if (request.CaseNumber is not null) hearing.CaseNumber = request.CaseNumber;
        if (request.CaseName is not null) hearing.CaseName = request.CaseName;
        if (request.CourtName is not null) hearing.CourtName = request.CourtName;
        if (request.CourtRoom is not null) hearing.CourtRoom = request.CourtRoom;
        if (request.HearingDate.HasValue) hearing.HearingDate = request.HearingDate.Value;
        if (request.StartTime.HasValue) hearing.StartTime = request.StartTime.Value;
        if (request.EndTime.HasValue) hearing.EndTime = request.EndTime.Value;
        if (request.AssignedLawyerId.HasValue) hearing.AssignedLawyerId = request.AssignedLawyerId.Value;
        if (request.Notes is not null) hearing.Notes = request.Notes;

        await _hearingRepo.UpdateAsync(hearing);
        await _auditTrailRepo.LogAsync(nameof(HearingSchedule), hearing.Id, "Update", userId);

        return await GetByIdAsync(hearing.Id);
    }

    public async Task ChangeStatusAsync(Guid id, HearingStatus newStatus, Guid userId, string? reason = null)
    {
        var hearing = await _hearingRepo.GetByIdAsync(id);
        if (hearing is null)
            throw new KeyNotFoundException($"Hearing {id} not found");

        var oldStatus = hearing.Status;
        hearing.Status = newStatus;
        await _hearingRepo.UpdateAsync(hearing);

        await _statusLogRepo.AddAsync(new StatusChangeLog
        {
            HearingId = id,
            FromStatus = oldStatus,
            ToStatus = newStatus,
            ChangedBy = userId,
            Reason = reason
        });

        await _auditTrailRepo.LogAsync(nameof(HearingSchedule), id, $"StatusChange:{oldStatus}->{newStatus}", userId, reason);
    }

    public async Task BatchChangeStatusAsync(BatchStatusUpdateRequest request, Guid userId)
    {
        foreach (var hearingId in request.HearingIds)
        {
            await ChangeStatusAsync(hearingId, request.Status, userId, request.Reason);
        }
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var hearing = await _hearingRepo.GetByIdAsync(id);
        if (hearing is null)
            throw new KeyNotFoundException($"Hearing {id} not found");

        hearing.Status = HearingStatus.Cancelled;
        await _hearingRepo.UpdateAsync(hearing);

        await _statusLogRepo.AddAsync(new StatusChangeLog
        {
            HearingId = id,
            FromStatus = hearing.Status,
            ToStatus = HearingStatus.Cancelled,
            ChangedBy = userId,
            Reason = "Soft delete"
        });

        await _auditTrailRepo.LogAsync(nameof(HearingSchedule), id, "Delete", userId);
    }

    public async Task<IEnumerable<CalendarSlotResponse>> GetAvailableSlotsAsync(DateOnly date, string courtRoom)
    {
        var slots = await _calendarSlotRepo.FindAsync(s => s.Date == date && s.CourtRoom == courtRoom && s.CurrentCount < s.MaxCapacity);
        return slots.Select(s => new CalendarSlotResponse(s.Id, s.Date, s.StartTime, s.EndTime, s.CourtRoom, s.MaxCapacity, s.CurrentCount));
    }

    private async Task ValidateCapacityInternalAsync(DateOnly date, string courtRoom)
    {
        var rules = await _capacityRuleRepo.FindAsync(r =>
            r.CourtRoom == courtRoom && r.IsActive &&
            r.EffectiveFrom <= date &&
            (r.EffectiveTo == null || r.EffectiveTo >= date));

        var rule = rules.FirstOrDefault();
        if (rule is null) return;

        var hearings = await _hearingRepo.FindAsync(h =>
            h.HearingDate == date && h.CourtRoom == courtRoom && h.Status != HearingStatus.Cancelled);

        if (hearings.Count() >= rule.MaxHearingsPerSlot)
            throw new InvalidOperationException($"Capacity exceeded for {courtRoom} on {date}");
    }

    private static HearingDetailResponse MapToDetailResponse(HearingSchedule h)
    {
        return new HearingDetailResponse(
            h.Id,
            h.CaseNumber,
            h.CaseName,
            h.CourtName,
            h.CourtRoom,
            h.HearingDate,
            h.StartTime,
            h.EndTime,
            h.Status,
            h.IsConflictFlagged,
            h.ConflictId,
            h.CreatedBy,
            h.AssignedLawyerId,
            h.Notes,
            h.Participants.Select(p => new ParticipantResponse(
                p.Id, p.HearingId, p.UserId,
                p.User?.FullName ?? string.Empty,
                p.Role, p.AttendanceStatus, p.CheckInTime, p.Notes)).ToList(),
            h.Attachments.Select(a => new AttachmentResponse(
                a.Id, a.HearingId, a.FileName, a.FilePath, a.FileType,
                a.FileSize, a.AttachmentType, a.UploadedBy, a.Description, a.CreatedAt)).ToList(),
            h.StatusLogs.Select(s => new StatusLogEntry(
                s.Id, s.FromStatus, s.ToStatus, s.ChangedBy, s.Reason, s.CreatedAt)).ToList(),
            h.CreatedAt,
            h.UpdatedAt);
    }

    private static HearingListResponse MapToListResponse(HearingSchedule h)
    {
        return new HearingListResponse(
            h.Id, h.CaseNumber, h.CaseName, h.CourtName, h.CourtRoom,
            h.HearingDate, h.StartTime, h.EndTime, h.Status,
            h.IsConflictFlagged, h.AssignedLawyerId);
    }
}
