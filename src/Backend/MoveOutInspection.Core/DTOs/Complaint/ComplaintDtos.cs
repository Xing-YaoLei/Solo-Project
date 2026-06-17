
namespace MoveOutInspection.Core.DTOs.Complaint;

public class ComplaintTagDto
{
    public Guid Id { get; set; }
    public string TagName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Severity { get; set; }
    public string? Source { get; set; }
    public string? TaggedByName { get; set; }
    public DateTime TaggedAt { get; set; }
    public bool IsResolved { get; set; }
    public string? Resolution { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public class CreateComplaintTagDto
{
    public Guid MoveOutOrderId { get; set; }
    public string TagName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Severity { get; set; }
    public string? Source { get; set; }
}

public class ComplaintSummaryDto
{
    public Guid MoveOutOrderId { get; set; }
    public List<ComplaintTagDto> Tags { get; set; } = new();
    public int TotalCount { get; set; }
    public int UnresolvedCount { get; set; }
    public int HighSeverityCount { get; set; }
}
