
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.DTOs.Inspection;

public class InspectionItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? StandardValue { get; set; }
    public int SortOrder { get; set; }
}

public class InspectionRecordDto
{
    public Guid Id { get; set; }
    public Guid InspectionItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemCategory { get; set; } = string.Empty;
    public InspectionItemStatus Status { get; set; }
    public ResponsibilityParty Responsibility { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? Description { get; set; }
    public ICollection<string>? PhotoUrls { get; set; }
    public string? Remarks { get; set; }
    public Guid InspectedById { get; set; }
    public string? InspectedByName { get; set; }
    public DateTime InspectedAt { get; set; }
}

public class CreateInspectionRecordDto
{
    public Guid MoveOutOrderId { get; set; }
    public Guid InspectionItemId { get; set; }
    public InspectionItemStatus Status { get; set; }
    public ResponsibilityParty Responsibility { get; set; }
    public decimal? EstimatedCost { get; set; }
    public string? Description { get; set; }
    public ICollection<string>? PhotoUrls { get; set; }
    public string? Remarks { get; set; }
}

public class InspectionSummaryDto
{
    public Guid MoveOutOrderId { get; set; }
    public int TotalItems { get; set; }
    public int NormalItems { get; set; }
    public int MinorDamageItems { get; set; }
    public int MajorDamageItems { get; set; }
    public int MissingItems { get; set; }
    public int NotCheckedItems { get; set; }
    public decimal TotalEstimatedCost { get; set; }
    public DateTime? LastInspectedAt { get; set; }
}
