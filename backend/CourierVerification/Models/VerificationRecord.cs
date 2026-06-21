using CourierVerification.Enums;

namespace CourierVerification.Models;

public class VerificationRecord
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public string RecordNo { get; set; } = string.Empty;
    public VerificationStage Stage { get; set; }
    public VerificationStatus Status { get; set; }
    public string? AssignedTo { get; set; }
    public string? HandlerId { get; set; }
    public string? HandlerName { get; set; }
    public string? Remark { get; set; }
    public List<string> RatingTags { get; set; } = new();
    public string? RiderTrajectory { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? ConfirmedAt { get; set; }
    public DateTimeOffset? SupplementedAt { get; set; }
    public DateTimeOffset? ClosedAt { get; set; }

    public virtual Order? Order { get; set; }
    public virtual Rider? Rider { get; set; }
    public Guid? RiderId { get; set; }
    public virtual ICollection<VerificationPhoto> Photos { get; set; } = new List<VerificationPhoto>();
    public virtual ICollection<VerificationAttachment> Attachments { get; set; } = new List<VerificationAttachment>();
    public virtual ICollection<DamageReport> DamageReports { get; set; } = new List<DamageReport>();
    public virtual ICollection<ReviewRecord> Reviews { get; set; } = new List<ReviewRecord>();
    public virtual ICollection<TimePoint> TimePoints { get; set; } = new List<TimePoint>();
}
