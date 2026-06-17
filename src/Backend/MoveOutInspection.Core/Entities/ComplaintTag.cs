
namespace MoveOutInspection.Core.Entities;

public class ComplaintTag : EntityBase
{
    public Guid MoveOutOrderId { get; set; }
    public MoveOutOrder? MoveOutOrder { get; set; }
    public string TagName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Severity { get; set; }
    public string? Source { get; set; }
    public Guid? TaggedById { get; set; }
    public Staff? TaggedBy { get; set; }
    public DateTime TaggedAt { get; set; }
    public bool IsResolved { get; set; }
    public string? Resolution { get; set; }
    public DateTime? ResolvedAt { get; set; }
}
