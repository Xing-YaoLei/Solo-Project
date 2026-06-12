using ColdChainScheduler.Domain.Enums;

namespace ColdChainScheduler.Domain.Entities;

public class ExceptionOrder
{
    public int Id { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public int GroupBatchId { get; set; }
    public int? ArrivalListId { get; set; }
    public int? ProductTagId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public ExceptionType ExceptionType { get; set; }
    public ExceptionSeverity Severity { get; set; }
    public string? ImpactDescription { get; set; }
    public string? Responsibility { get; set; }
    public ExceptionResolution Resolution { get; set; } = ExceptionResolution.Pending;
    public string? ResolutionNotes { get; set; }
    public string? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public GroupBatch GroupBatch { get; set; } = null!;
    public ArrivalList? ArrivalList { get; set; }
    public ProductTag? ProductTag { get; set; }
}
