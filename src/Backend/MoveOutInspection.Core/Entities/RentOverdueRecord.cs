
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.Entities;

public class RentOverdueRecord : EntityBase
{
    public Guid MoveOutOrderId { get; set; }
    public MoveOutOrder? MoveOutOrder { get; set; }
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

    public ICollection<AffectedParty> AffectedParties { get; set; } = new List<AffectedParty>();
    public ICollection<ResponsibilityAdjustment> ResponsibilityAdjustments { get; set; } = new List<ResponsibilityAdjustment>();
}
