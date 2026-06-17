
namespace MoveOutInspection.Core.Entities;

public class InspectionTemplate : EntityBase
{
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<InspectionItem> Items { get; set; } = new List<InspectionItem>();
}
