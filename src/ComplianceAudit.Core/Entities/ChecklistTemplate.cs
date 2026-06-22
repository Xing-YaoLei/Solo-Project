namespace ComplianceAudit.Core.Entities;

public class ChecklistTemplate : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public long RegulationId { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual Regulation Regulation { get; set; } = null!;
    public virtual ICollection<ChecklistTemplateItem> Items { get; set; } = new List<ChecklistTemplateItem>();
}
