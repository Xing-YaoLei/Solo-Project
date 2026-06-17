
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.Entities;

public class AffectedParty : EntityBase
{
    public Guid RentOverdueRecordId { get; set; }
    public RentOverdueRecord? RentOverdueRecord { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public string? PartyType { get; set; }
    public RoleType? AssignedRole { get; set; }
    public Guid? StaffId { get; set; }
    public Staff? Staff { get; set; }
    public string? ContactInfo { get; set; }
    public string? ImpactDescription { get; set; }
    public decimal? ImpactAmount { get; set; }
    public bool HasSupplemented { get; set; }
    public string? SupplementaryNotes { get; set; }
    public DateTime? SupplementedAt { get; set; }
}
