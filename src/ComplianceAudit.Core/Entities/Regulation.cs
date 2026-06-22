namespace ComplianceAudit.Core.Entities;

public class Regulation : BaseEntity
{
    public string RegulationNo { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Version { get; set; }
    public DateTime EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? IssuingAuthority { get; set; }
    public string? Content { get; set; }
    public string? FileUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Tags { get; set; }

    public virtual ICollection<AuditSchedule> Schedules { get; set; } = new List<AuditSchedule>();
    public virtual ICollection<ChecklistTemplate> ChecklistTemplates { get; set; } = new List<ChecklistTemplate>();
}
