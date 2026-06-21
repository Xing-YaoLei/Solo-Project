using HearingCalendar.Application.Dtos;

namespace HearingCalendar.Application.Interfaces;

public interface IReminderService
{
    Task<ReminderResponse> CreateAsync(CreateReminderRequest request);
    Task<IEnumerable<ReminderResponse>> GetByHearingAsync(Guid hearingId, Guid? callerUserId = null);
    Task ProcessPendingRemindersAsync();
    Task MarkAsSentAsync(Guid reminderId);
    Task<IEnumerable<ReminderResponse>> GetPendingRemindersAsync(Guid? callerUserId = null);
}
