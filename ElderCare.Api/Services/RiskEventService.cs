using ElderCare.Api.Data;
using ElderCare.Api.DTOs;
using ElderCare.Api.Models;
using ElderCare.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace ElderCare.Api.Services;

public class RiskEventService : IRiskEventService
{
    private readonly AppDbContext _context;

    public RiskEventService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<RiskEventDto>> GetAllRiskEventsAsync()
    {
        return await _context.RiskEvents
            .Include(r => r.Elderly)
            .Include(r => r.Area)
            .Include(r => r.ReportedByStaff)
            .Include(r => r.AssignedStaff)
            .Select(r => new RiskEventDto
            {
                Id = r.Id,
                ElderlyId = r.ElderlyId,
                ElderlyName = r.Elderly.Name,
                EventType = r.EventType.ToString(),
                Severity = r.Severity.ToString(),
                Description = r.Description,
                EventTime = r.EventTime,
                Location = r.Location,
                AreaId = r.AreaId,
                AreaName = r.Area.Name,
                ReportedByStaffId = r.ReportedByStaffId,
                ReportedByStaffName = r.ReportedByStaff != null ? r.ReportedByStaff.Name : null,
                AssignedStaffId = r.AssignedStaffId,
                AssignedStaffName = r.AssignedStaff != null ? r.AssignedStaff.Name : null,
                Status = r.Status,
                Resolution = r.Resolution,
                ResolvedAt = r.ResolvedAt
            })
            .ToListAsync();
    }

    public async Task<RiskEventDto?> GetRiskEventByIdAsync(int id)
    {
        return await _context.RiskEvents
            .Include(r => r.Elderly)
            .Include(r => r.Area)
            .Include(r => r.ReportedByStaff)
            .Include(r => r.AssignedStaff)
            .Where(r => r.Id == id)
            .Select(r => new RiskEventDto
            {
                Id = r.Id,
                ElderlyId = r.ElderlyId,
                ElderlyName = r.Elderly.Name,
                EventType = r.EventType.ToString(),
                Severity = r.Severity.ToString(),
                Description = r.Description,
                EventTime = r.EventTime,
                Location = r.Location,
                AreaId = r.AreaId,
                AreaName = r.Area.Name,
                ReportedByStaffId = r.ReportedByStaffId,
                ReportedByStaffName = r.ReportedByStaff != null ? r.ReportedByStaff.Name : null,
                AssignedStaffId = r.AssignedStaffId,
                AssignedStaffName = r.AssignedStaff != null ? r.AssignedStaff.Name : null,
                Status = r.Status,
                Resolution = r.Resolution,
                ResolvedAt = r.ResolvedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<RiskEventDto> CreateRiskEventAsync(CreateRiskEventDto dto)
    {
        var entity = new RiskEvent
        {
            ElderlyId = dto.ElderlyId,
            EventType = dto.EventType,
            Severity = dto.Severity,
            Description = dto.Description,
            EventTime = dto.EventTime,
            Location = dto.Location,
            AreaId = dto.AreaId,
            ReportedByStaffId = dto.ReportedByStaffId,
            AssignedStaffId = dto.AssignedStaffId,
            Status = "Open"
        };
        _context.RiskEvents.Add(entity);
        await _context.SaveChangesAsync();
        return await GetRiskEventByIdAsync(entity.Id) ?? throw new InvalidOperationException();
    }

    public async Task<RiskEventDto?> UpdateRiskEventAsync(int id, UpdateRiskEventDto dto)
    {
        var entity = await _context.RiskEvents.FindAsync(id);
        if (entity == null) return null;
        entity.EventType = dto.EventType;
        entity.Severity = dto.Severity;
        entity.Description = dto.Description;
        entity.EventTime = dto.EventTime;
        entity.Location = dto.Location;
        entity.AreaId = dto.AreaId;
        entity.ReportedByStaffId = dto.ReportedByStaffId;
        entity.AssignedStaffId = dto.AssignedStaffId;
        entity.Status = dto.Status;
        entity.Resolution = dto.Resolution;
        entity.ResolvedAt = dto.ResolvedAt;
        await _context.SaveChangesAsync();
        return await GetRiskEventByIdAsync(id);
    }

    public async Task<ReminderActionDto> PushReminderAsync(int riskEventId, CreateReminderActionDto dto)
    {
        var riskEvent = await _context.RiskEvents.FindAsync(riskEventId);
        if (riskEvent == null) throw new KeyNotFoundException($"RiskEvent {riskEventId} not found");

        var entity = new RiskEventReminder
        {
            RiskEventId = riskEventId,
            ActionType = ReminderActionType.Pushed,
            StaffId = riskEvent.AssignedStaffId,
            Message = dto.Message,
            ActionTime = DateTime.UtcNow,
            IsSuccessful = true,
            RetryCount = 0,
            Notes = dto.Notes
        };
        _context.RiskEventReminders.Add(entity);

        if (riskEvent.Status == "Open")
        {
            riskEvent.Status = "Processing";
        }

        await _context.SaveChangesAsync();

        return await MapToReminderActionDto(entity.Id);
    }

    public async Task<ReminderActionDto> SupplementReminderAsync(int riskEventId, CreateReminderActionDto dto)
    {
        var riskEvent = await _context.RiskEvents.FindAsync(riskEventId);
        if (riskEvent == null) throw new KeyNotFoundException($"RiskEvent {riskEventId} not found");

        var entity = new RiskEventReminder
        {
            RiskEventId = riskEventId,
            ActionType = ReminderActionType.Supplemented,
            StaffId = riskEvent.AssignedStaffId,
            Message = dto.Message,
            ActionTime = DateTime.UtcNow,
            IsSuccessful = true,
            RetryCount = 0,
            Notes = dto.Notes
        };
        _context.RiskEventReminders.Add(entity);
        await _context.SaveChangesAsync();

        return await MapToReminderActionDto(entity.Id);
    }

    public async Task<ReminderActionDto> RetryReminderAsync(int riskEventId, int reminderId, CreateReminderActionDto dto)
    {
        var parentReminder = await _context.RiskEventReminders.FindAsync(reminderId);
        if (parentReminder == null) throw new KeyNotFoundException($"Reminder {reminderId} not found");

        var entity = new RiskEventReminder
        {
            RiskEventId = riskEventId,
            ActionType = ReminderActionType.Retried,
            StaffId = parentReminder.StaffId,
            Message = dto.Message,
            ActionTime = DateTime.UtcNow,
            IsSuccessful = false,
            RetryCount = parentReminder.RetryCount + 1,
            ParentReminderId = reminderId,
            Notes = dto.Notes
        };
        _context.RiskEventReminders.Add(entity);
        await _context.SaveChangesAsync();

        return await MapToReminderActionDto(entity.Id);
    }

    public async Task<ReminderActionDto> CloseReminderAsync(int riskEventId, int reminderId, CreateReminderActionDto dto)
    {
        var parentReminder = await _context.RiskEventReminders.FindAsync(reminderId);
        if (parentReminder == null) throw new KeyNotFoundException($"Reminder {reminderId} not found");

        var riskEvent = await _context.RiskEvents.FindAsync(riskEventId);
        if (riskEvent == null) throw new KeyNotFoundException($"RiskEvent {riskEventId} not found");

        var closedReminder = new RiskEventReminder
        {
            RiskEventId = riskEventId,
            ActionType = ReminderActionType.Closed,
            StaffId = parentReminder.StaffId,
            Message = dto.Message,
            ActionTime = DateTime.UtcNow,
            IsSuccessful = true,
            RetryCount = parentReminder.RetryCount,
            ParentReminderId = reminderId,
            Notes = dto.Notes
        };
        _context.RiskEventReminders.Add(closedReminder);

        riskEvent.Status = "Closed";
        riskEvent.ResolvedAt = DateTime.UtcNow;
        riskEvent.Resolution = dto.Message;

        await _context.SaveChangesAsync();

        return await MapToReminderActionDto(closedReminder.Id);
    }

    public async Task<IEnumerable<ReminderActionDto>> GetReminderHistoryAsync(int riskEventId)
    {
        return await _context.RiskEventReminders
            .Include(r => r.Staff)
            .Where(r => r.RiskEventId == riskEventId)
            .OrderBy(r => r.ActionTime)
            .Select(r => new ReminderActionDto
            {
                Id = r.Id,
                RiskEventId = r.RiskEventId,
                ActionType = r.ActionType.ToString(),
                StaffId = r.StaffId,
                StaffName = r.Staff != null ? r.Staff.Name : null,
                Message = r.Message,
                ActionTime = r.ActionTime,
                IsSuccessful = r.IsSuccessful,
                RetryCount = r.RetryCount,
                ParentReminderId = r.ParentReminderId,
                Notes = r.Notes
            })
            .ToListAsync();
    }

    public async Task<RiskEventTimelineDto> GetRiskEventTimelineAsync(int riskEventId)
    {
        var riskEvent = await GetRiskEventByIdAsync(riskEventId);
        if (riskEvent == null) throw new KeyNotFoundException($"RiskEvent {riskEventId} not found");

        var reminders = await GetReminderHistoryAsync(riskEventId);

        return new RiskEventTimelineDto
        {
            RiskEvent = riskEvent,
            Reminders = reminders.ToList()
        };
    }

    private async Task<ReminderActionDto> MapToReminderActionDto(int reminderId)
    {
        var r = await _context.RiskEventReminders
            .Include(rem => rem.Staff)
            .FirstAsync(rem => rem.Id == reminderId);

        return new ReminderActionDto
        {
            Id = r.Id,
            RiskEventId = r.RiskEventId,
            ActionType = r.ActionType.ToString(),
            StaffId = r.StaffId,
            StaffName = r.Staff != null ? r.Staff.Name : null,
            Message = r.Message,
            ActionTime = r.ActionTime,
            IsSuccessful = r.IsSuccessful,
            RetryCount = r.RetryCount,
            ParentReminderId = r.ParentReminderId,
            Notes = r.Notes
        };
    }
}
