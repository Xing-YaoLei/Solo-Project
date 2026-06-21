using HearingCalendar.Domain.Common;

namespace HearingCalendar.Domain.Entities;

public class CalendarSlot : BaseEntity
{
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public required string CourtRoom { get; set; }
    public int MaxCapacity { get; set; }
    public int CurrentCount { get; set; }
}
