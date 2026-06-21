using HearingCalendar.Domain.Common;
using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Domain.Entities;

public class HearingParticipant : BaseEntity
{
    public Guid HearingId { get; set; }
    public Guid UserId { get; set; }
    public required string Role { get; set; }
    public AttendanceStatus AttendanceStatus { get; set; }
    public DateTime? CheckInTime { get; set; }
    public string? Notes { get; set; }

    public HearingSchedule Hearing { get; set; } = null!;
    public User User { get; set; } = null!;
}
