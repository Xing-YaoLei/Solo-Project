using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Entities;
using HearingCalendar.Domain.Enums;
using HearingCalendar.Infrastructure.Repositories;

namespace HearingCalendar.Application.Services;

public class ReminderService : IReminderService
{
    private readonly IRepository<Reminder> _reminderRepo;
    private readonly AuditTrailRepository _auditTrailRepo;

    public ReminderService(
        IRepository<Reminder> reminderRepo,
        AuditTrailRepository auditTrailRepo)
    {
        _reminderRepo = reminderRepo;
        _auditTrailRepo = auditTrailRepo;
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

    public async Task<IEnumerable<ReminderResponse>> GetByHearingAsync(Guid hearingId)
    {
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

    public async Task<IEnumerable<ReminderResponse>> GetPendingRemindersAsync()
    {
        var reminders = await _reminderRepo.FindAsync(r => r.Status == ReminderStatus.Pending);
        return reminders.Select(MapToResponse);
    }

    private static ReminderResponse MapToResponse(Reminder r)
    {
        return new ReminderResponse(
            r.Id, r.HearingId, r.ReminderType, r.Status,
            r.RemindAt, r.SentAt, r.TargetUserId, r.Message);
    }
}
