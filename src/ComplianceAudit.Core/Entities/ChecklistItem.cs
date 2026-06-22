using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Entities;

public class ChecklistItem : BaseEntity
{
    public long ScheduleId { get; set; }
    public long? TemplateItemId { get; set; }
    public string ItemNo { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public RiskLevel RiskLevel { get; set; }
    public string? EvidenceRequirements { get; set; }
    public int SortOrder { get; set; }
    public CheckStatus Status { get; set; }
    public bool? IsCompliant { get; set; }
    public string? Findings { get; set; }
    public string? AuditNotes { get; set; }
    public DateTime? CheckedAt { get; set; }
    public long? CheckedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public long? ReviewedBy { get; set; }
    public EvidenceStatus EvidenceStatus { get; set; } = EvidenceStatus.Missing;

    public virtual AuditSchedule Schedule { get; set; } = null!;
    public virtual ChecklistTemplateItem? TemplateItem { get; set; }
    public virtual ICollection<CheckRecord> CheckRecords { get; set; } = new List<CheckRecord>();
    public virtual ICollection<Evidence> Evidences { get; set; } = new List<Evidence>();
    public virtual ICollection<EvidenceMissingRecord> EvidenceMissingRecords { get; set; } = new List<EvidenceMissingRecord>();
}
