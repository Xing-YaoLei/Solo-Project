using HearingCalendar.Domain.Common;
using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Domain.Entities;

public class ConflictOfInterest : BaseEntity
{
    public Guid HearingId { get; set; }
    public ConflictType ConflictType { get; set; }
    public required string Description { get; set; }
    public Guid DetectedBy { get; set; }
    public DateTime DetectedAt { get; set; }
    public ConflictResolutionStatus ResolutionStatus { get; set; }
    public string? Resolution { get; set; }
    public Guid? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public Guid? RelatedAttachmentId { get; set; }

    public HearingSchedule Hearing { get; set; } = null!;
    public HearingAttachment? RelatedAttachment { get; set; }
}
