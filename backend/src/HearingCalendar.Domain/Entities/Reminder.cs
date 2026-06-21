using HearingCalendar.Domain.Common;
using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Domain.Entities;

public class Reminder : BaseEntity
{
    public Guid HearingId { get; set; }
    public ReminderType ReminderType { get; set; }
    public ReminderStatus Status { get; set; }
    public DateTime RemindAt { get; set; }
    public DateTime? SentAt { get; set; }
    public Guid TargetUserId { get; set; }
    public string? Message { get; set; }

    public HearingSchedule Hearing { get; set; } = null!;
}
