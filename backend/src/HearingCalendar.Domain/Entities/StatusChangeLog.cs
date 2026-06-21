using HearingCalendar.Domain.Common;
using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Domain.Entities;

public class StatusChangeLog : BaseEntity
{
    public Guid HearingId { get; set; }
    public HearingStatus FromStatus { get; set; }
    public HearingStatus ToStatus { get; set; }
    public Guid ChangedBy { get; set; }
    public string? Reason { get; set; }
    public Guid? RelatedAttachmentId { get; set; }

    public HearingSchedule Hearing { get; set; } = null!;
    public HearingAttachment? RelatedAttachment { get; set; }
}
