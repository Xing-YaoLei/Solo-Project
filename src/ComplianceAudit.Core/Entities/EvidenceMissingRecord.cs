using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Entities;

public class EvidenceMissingRecord : BaseEntity
{
    public long CheckRecordId { get; set; }
    public long? ChecklistItemId { get; set; }
    public string MissingNo { get; set; } = string.Empty;
    public EvidenceStatus Status { get; set; }
    public string MissingDescription { get; set; } = string.Empty;
    public string? EvidenceRequired { get; set; }
    public long RequestedById { get; set; }
    public long? ResponsibleId { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? Deadline { get; set; }
    public DateTime? SuppliedAt { get; set; }
    public string? SupplierComments { get; set; }
    public string? ReviewerComments { get; set; }
    public bool? IsWaived { get; set; }
    public string? WaiveReason { get; set; }

    public virtual CheckRecord CheckRecord { get; set; } = null!;
    public virtual ChecklistItem? ChecklistItem { get; set; }
    public virtual ApplicationUser RequestedBy { get; set; } = null!;
    public virtual ApplicationUser? Responsible { get; set; }
    public virtual ICollection<Evidence> SuppliedEvidences { get; set; } = new List<Evidence>();
    public virtual ICollection<ProcessingHistory> ProcessingHistories { get; set; } = new List<ProcessingHistory>();
}
