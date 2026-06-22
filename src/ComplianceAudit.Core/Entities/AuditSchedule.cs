using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Entities;

public class AuditSchedule : BaseEntity
{
    public string ScheduleNo { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long RegulationId { get; set; }
    public long AuditorId { get; set; }
    public long? BusinessOwnerId { get; set; }
    public ScheduleFrequency Frequency { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime DueDate { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public CheckStatus Status { get; set; }
    public string? Scope { get; set; }
    public string? Remarks { get; set; }

    public virtual Regulation Regulation { get; set; } = null!;
    public virtual ApplicationUser Auditor { get; set; } = null!;
    public virtual ApplicationUser? BusinessOwner { get; set; }
    public virtual ICollection<ChecklistItem> ChecklistItems { get; set; } = new List<ChecklistItem>();
    public virtual ICollection<SamplingRecord> SamplingRecords { get; set; } = new List<SamplingRecord>();
    public virtual ICollection<CheckRecord> CheckRecords { get; set; } = new List<CheckRecord>();
    public virtual ICollection<Rectification> Rectifications { get; set; } = new List<Rectification>();
}
