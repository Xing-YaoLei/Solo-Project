using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Entities;

public class CheckRecord : BaseEntity
{
    public long ScheduleId { get; set; }
    public long? ChecklistItemId { get; set; }
    public long? SamplingRecordId { get; set; }
    public CheckStatus Status { get; set; }
    public bool? IsCompliant { get; set; }
    public string? Findings { get; set; }
    public string? AuditNotes { get; set; }
    public string? BusinessResponse { get; set; }
    public string? ReviewComments { get; set; }
    public DateTime? CheckedAt { get; set; }
    public long? CheckedBy { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public long? SubmittedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public long? ReviewedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public long? ApprovedBy { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public EvidenceStatus EvidenceStatus { get; set; } = EvidenceStatus.Missing;
    public string? SourceReference { get; set; }
    public string? AuditTrail { get; set; }

    public virtual AuditSchedule Schedule { get; set; } = null!;
    public virtual ChecklistItem? ChecklistItem { get; set; }
    public virtual SamplingRecord? SamplingRecord { get; set; }
    public virtual ApplicationUser CheckedByUser { get; set; } = null!;
    public virtual ICollection<Evidence> Evidences { get; set; } = new List<Evidence>();
    public virtual ICollection<Rectification> Rectifications { get; set; } = new List<Rectification>();
    public virtual ICollection<EvidenceMissingRecord> EvidenceMissingRecords { get; set; } = new List<EvidenceMissingRecord>();
    public virtual ICollection<ProcessingHistory> ProcessingHistories { get; set; } = new List<ProcessingHistory>();
}
