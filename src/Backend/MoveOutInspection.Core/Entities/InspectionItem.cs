
namespace MoveOutInspection.Core.Entities;

public class InspectionItem : EntityBase
{
    public Guid InspectionTemplateId { get; set; }
    public InspectionTemplate? InspectionTemplate { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? StandardValue { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
