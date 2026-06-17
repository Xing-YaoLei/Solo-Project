
namespace MoveOutInspection.Core.Entities;

public class UtilityReading : EntityBase
{
    public Guid MoveOutOrderId { get; set; }
    public MoveOutOrder? MoveOutOrder { get; set; }
    public string UtilityType { get; set; } = string.Empty;
    public decimal PreviousReading { get; set; }
    public DateTime? PreviousReadingDate { get; set; }
    public decimal CurrentReading { get; set; }
    public DateTime CurrentReadingDate { get; set; }
    public decimal Usage { get; set; }
    public decimal? UnitPrice { get; set; }
    public decimal? Amount { get; set; }
    public string? MeterNumber { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Remarks { get; set; }
    public Guid RecordedById { get; set; }
    public Staff? RecordedBy { get; set; }
}
