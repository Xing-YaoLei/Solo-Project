
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.DTOs.Overdue;

public class RentOverdueRecordDto
{
    public Guid Id { get; set; }
    public Guid MoveOutOrderId { get; set; }
    public string? OrderNumber { get; set; }
    public string? TenantName { get; set; }
    public string? ApartmentNumber { get; set; }
    public int OverdueDays { get; set; }
    public decimal OverdueAmount { get; set; }
    public decimal? LateFee { get; set; }
    public DateTime DueDate { get; set; }
    public DateTime RecordedDate { get; set; }
    public string? BillingPeriod { get; set; }
    public bool IsResolved { get; set; }
    public string? Resolution { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public ResponsibilityParty InitialResponsibility { get; set; }
    public ResponsibilityParty FinalResponsibility { get; set; }
    public string? SupplementaryNotes { get; set; }
    public List<AffectedPartyDto> AffectedParties { get; set; } = new();
    public List<ResponsibilityAdjustmentDto> ResponsibilityAdjustments { get; set; } = new();
}

public class AffectedPartyDto
{
    public Guid Id { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public string? PartyType { get; set; }
    public RoleType? AssignedRole { get; set; }
    public Guid? StaffId { get; set; }
    public string? StaffName { get; set; }
    public string? ContactInfo { get; set; }
    public string? ImpactDescription { get; set; }
    public decimal? ImpactAmount { get; set; }
    public bool HasSupplemented { get; set; }
    public string? SupplementaryNotes { get; set; }
    public DateTime? SupplementedAt { get; set; }
}

public class ResponsibilityAdjustmentDto
{
    public Guid Id { get; set; }
    public ResponsibilityParty PreviousResponsibility { get; set; }
    public ResponsibilityParty NewResponsibility { get; set; }
    public string AdjustmentReason { get; set; } = string.Empty;
    public string? EvidenceUrls { get; set; }
    public Guid AdjustedById { get; set; }
    public string? AdjustedByName { get; set; }
    public RoleType AdjusterRole { get; set; }
    public DateTime AdjustedAt { get; set; }
    public bool IsApproved { get; set; }
    public Guid? ApprovedById { get; set; }
    public string? ApprovedByName { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public class CreateRentOverdueDto
{
    public Guid MoveOutOrderId { get; set; }
    public int OverdueDays { get; set; }
    public decimal OverdueAmount { get; set; }
    public decimal? LateFee { get; set; }
    public DateTime DueDate { get; set; }
    public string? BillingPeriod { get; set; }
    public ResponsibilityParty InitialResponsibility { get; set; }
    public List<CreateAffectedPartyDto> AffectedParties { get; set; } = new();
}

public class CreateAffectedPartyDto
{
    public string PartyName { get; set; } = string.Empty;
    public string? PartyType { get; set; }
    public RoleType? AssignedRole { get; set; }
    public Guid? StaffId { get; set; }
    public string? ContactInfo { get; set; }
    public string? ImpactDescription { get; set; }
    public decimal? ImpactAmount { get; set; }
}

public class SupplementAffectedPartyDto
{
    public string SupplementaryNotes { get; set; } = string.Empty;
}

public class AdjustResponsibilityDto
{
    public ResponsibilityParty NewResponsibility { get; set; }
    public string AdjustmentReason { get; set; } = string.Empty;
    public string? EvidenceUrls { get; set; }
}
