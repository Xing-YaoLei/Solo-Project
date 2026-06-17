
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.Entities;

public class RepairRecord : EntityBase
{
    public Guid MoveOutOrderId { get; set; }
    public MoveOutOrder? MoveOutOrder { get; set; }
    public Guid? InspectionRecordId { get; set; }
    public InspectionRecord? InspectionRecord { get; set; }
    public string RepairItem { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal EstimatedCost { get; set; }
    public decimal ActualCost { get; set; }
    public DateTime? ReportedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int? DurationHours { get; set; }
    public Guid? AssignedToId { get; set; }
    public Staff? AssignedTo { get; set; }
    public ResponsibilityParty Responsibility { get; set; }
    public string? Status { get; set; }
    public string? Remarks { get; set; }
    public ICollection<string>? PhotoUrls { get; set; }
}
