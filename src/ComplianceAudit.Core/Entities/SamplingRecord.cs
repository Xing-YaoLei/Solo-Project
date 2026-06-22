using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Entities;

public class SamplingRecord : BaseEntity
{
    public long ScheduleId { get; set; }
    public string SamplingNo { get; set; } = string.Empty;
    public string SourceSystem { get; set; } = string.Empty;
    public string SourceModule { get; set; } = string.Empty;
    public string DocumentNo { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public DateTime DocumentDate { get; set; }
    public string? Department { get; set; }
    public string? BusinessOwner { get; set; }
    public string? Description { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public CheckStatus Status { get; set; }
    public string? SamplingReason { get; set; }
    public string? BatchNo { get; set; }
    public decimal? Amount { get; set; }
    public string? Currency { get; set; }

    public virtual AuditSchedule Schedule { get; set; } = null!;
    public virtual ICollection<CheckRecord> CheckRecords { get; set; } = new List<CheckRecord>();
    public virtual ICollection<Evidence> Evidences { get; set; } = new List<Evidence>();
}
