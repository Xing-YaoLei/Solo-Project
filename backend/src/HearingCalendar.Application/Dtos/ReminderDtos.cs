using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Application.Dtos;

public record CreateReminderRequest(
    Guid HearingId,
    ReminderType ReminderType,
    DateTime RemindAt,
    Guid TargetUserId,
    string? Message);

public record ReminderResponse(
    Guid Id,
    Guid HearingId,
    ReminderType ReminderType,
    ReminderStatus Status,
    DateTime RemindAt,
    DateTime? SentAt,
    Guid TargetUserId,
    string? Message);
