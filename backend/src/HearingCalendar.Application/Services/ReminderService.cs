using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Entities;
using HearingCalendar.Domain.Enums;
using HearingCalendar.Infrastructure.Data;
using HearingCalendar.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace HearingCalendar.Application.Services;

public class ReminderService : IReminderService
{
    private readonly IRepository<Reminder> _reminderRepo;
    private readonly AuditTrailRepository _auditTrailRepo;
    private readonly HearingCalendarDbContext _dbContext;

    public ReminderService(
        IRepository<Reminder> reminderRepo,
        AuditTrailRepository auditTrailRepo,
        HearingCalendarDbContext dbContext)
    {
        _reminderRepo = reminderRepo;
        _auditTrailRepo = auditTrailRepo;
        _dbContext = dbContext;
    }

    public async Task<ReminderResponse> CreateAsync(CreateReminderRequest request)
    {
        var reminder = new Reminder
        {
            HearingId = request.HearingId,
            ReminderType = request.ReminderType,
            Status = ReminderStatus.Pending,
            RemindAt = request.RemindAt,
            TargetUserId = request.TargetUserId,
            Message = request.Message,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _reminderRepo.AddAsync(reminder);
        return MapToResponse(created);
    }

    public async Task<IEnumerable<ReminderResponse>> GetByHearingAsync(Guid hearingId, Guid? callerUserId = null)
    {
        if (callerUserId.HasValue)
        {
            var caller = await _dbContext.Users.FindAsync(callerUserId.Value);
            if (caller?.Role == UserRole.Client)
            {
                var canAccess = await _dbContext.HearingSchedules
                    .AnyAsync(h => h.Id == hearingId &&
                                   h.Participants.Any(p => p.UserId == callerUserId.Value));
                if (!canAccess)
                    throw new UnauthorizedAccessException("You do not have permission to view reminders of this hearing");
            }
        }

        var reminders = await _reminderRepo.FindAsync(r => r.HearingId == hearingId);
        return reminders.Select(MapToResponse);
    }

    public async Task ProcessPendingRemindersAsync()
    {
        var pending = await _reminderRepo.FindAsync(r =>
            r.Status == ReminderStatus.Pending && r.RemindAt <= DateTime.UtcNow);

        foreach (var reminder in pending)
        {
            reminder.Status = ReminderStatus.Sent;
            reminder.SentAt = DateTime.UtcNow;
            await _reminderRepo.UpdateAsync(reminder);
        }
    }

    public async Task MarkAsSentAsync(Guid reminderId)
    {
        var reminder = await _reminderRepo.GetByIdAsync(reminderId);
        if (reminder is null)
            throw new KeyNotFoundException($"Reminder {reminderId} not found");

        reminder.Status = ReminderStatus.Sent;
        reminder.SentAt = DateTime.UtcNow;
        await _reminderRepo.UpdateAsync(reminder);
    }

    public async Task<IEnumerable<ReminderResponse>> GetPendingRemindersAsync(Guid? callerUserId = null)
    {
        var query = _dbContext.Reminders
            .Where(r => r.Status == ReminderStatus.Pending);

        if (callerUserId.HasValue)
        {
            var caller = await _dbContext.Users.FindAsync(callerUserId.Value);
            if (caller?.Role == UserRole.Client)
            {
                query = query.Where(r =>
                    r.Hearing.Participants.Any(p => p.UserId == callerUserId.Value));
            }
        }

        var reminders = await query.ToListAsync();
        return reminders.Select(MapToResponse);
    }

    private static ReminderResponse MapToResponse(Reminder r)
    {
        return new ReminderResponse(
            r.Id, r.HearingId, r.ReminderType, r.Status,
            r.RemindAt, r.SentAt, r.TargetUserId, r.Message);
    }
}
