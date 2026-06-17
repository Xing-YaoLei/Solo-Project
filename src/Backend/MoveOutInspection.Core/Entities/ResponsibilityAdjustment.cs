
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.Entities;

public class ResponsibilityAdjustment : EntityBase
{
    public Guid RentOverdueRecordId { get; set; }
    public RentOverdueRecord? RentOverdueRecord { get; set; }
    public ResponsibilityParty PreviousResponsibility { get; set; }
    public ResponsibilityParty NewResponsibility { get; set; }
    public string AdjustmentReason { get; set; } = string.Empty;
    public string? EvidenceUrls { get; set; }
    public Guid AdjustedById { get; set; }
    public Staff? AdjustedBy { get; set; }
    public RoleType AdjusterRole { get; set; }
    public DateTime AdjustedAt { get; set; }
    public bool IsApproved { get; set; }
    public Guid? ApprovedById { get; set; }
    public Staff? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}
