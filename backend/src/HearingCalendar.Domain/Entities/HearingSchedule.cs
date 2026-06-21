using HearingCalendar.Domain.Common;
using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Domain.Entities;

public class HearingSchedule : BaseEntity
{
    public required string CaseNumber { get; set; }
    public required string CaseName { get; set; }
    public required string CourtName { get; set; }
    public required string CourtRoom { get; set; }
    public DateOnly HearingDate { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public HearingStatus Status { get; set; }
    public bool IsConflictFlagged { get; set; }
    public Guid? ConflictId { get; set; }
    public Guid CreatedBy { get; set; }
    public Guid? AssignedLawyerId { get; set; }
    public string? Notes { get; set; }

    public ICollection<HearingParticipant> Participants { get; set; } = new List<HearingParticipant>();
    public ICollection<HearingAttachment> Attachments { get; set; } = new List<HearingAttachment>();
    public ICollection<StatusChangeLog> StatusLogs { get; set; } = new List<StatusChangeLog>();
    public ConflictOfInterest? Conflict { get; set; }
    public ICollection<Reminder> Reminders { get; set; } = new List<Reminder>();
}
