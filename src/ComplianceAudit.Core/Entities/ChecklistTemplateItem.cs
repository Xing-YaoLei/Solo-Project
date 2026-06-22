using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Entities;

public class ChecklistTemplateItem : BaseEntity
{
    public long TemplateId { get; set; }
    public string ItemNo { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public RiskLevel RiskLevel { get; set; }
    public string? EvidenceRequirements { get; set; }
    public int SortOrder { get; set; }

    public virtual ChecklistTemplate Template { get; set; } = null!;
}
