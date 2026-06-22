using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Entities;

public class Rectification : BaseEntity
{
    public long ScheduleId { get; set; }
    public long? CheckRecordId { get; set; }
    public string RectificationNo { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RootCause { get; set; } = string.Empty;
    public string ActionPlan { get; set; } = string.Empty;
    public long OwnerId { get; set; }
    public DateTime Deadline { get; set; }
    public RectificationStatus Status { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? PreventiveAction { get; set; }
    public string? VerificationResult { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public long? VerifiedBy { get; set; }
    public string? Remarks { get; set; }

    public virtual AuditSchedule Schedule { get; set; } = null!;
    public virtual CheckRecord? CheckRecord { get; set; }
    public virtual ApplicationUser Owner { get; set; } = null!;
    public virtual ICollection<Evidence> Evidences { get; set; } = new List<Evidence>();
    public virtual ICollection<ProcessingHistory> ProcessingHistories { get; set; } = new List<ProcessingHistory>();
}
