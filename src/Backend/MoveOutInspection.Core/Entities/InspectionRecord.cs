
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.Entities;

public class InspectionRecord : EntityBase
{
    public Guid MoveOutOrderId { get; set; }
    public MoveOutOrder? MoveOutOrder { get; set; }
    public Guid InspectionItemId { get; set; }
    public InspectionItem? InspectionItem { get; set; }
    public InspectionItemStatus Status { get; set; }
    public ResponsibilityParty Responsibility { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? Description { get; set; }
    public ICollection<string>? PhotoUrls { get; set; }
    public string? Remarks { get; set; }
    public Guid InspectedById { get; set; }
    public Staff? InspectedBy { get; set; }
    public DateTime InspectedAt { get; set; }
}
