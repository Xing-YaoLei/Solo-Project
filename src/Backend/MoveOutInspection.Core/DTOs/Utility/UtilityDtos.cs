
namespace MoveOutInspection.Core.DTOs.Utility;

public class UtilityReadingDto
{
    public Guid Id { get; set; }
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
    public string? RecordedByName { get; set; }
}

public class CreateUtilityReadingDto
{
    public Guid MoveOutOrderId { get; set; }
    public string UtilityType { get; set; } = string.Empty;
    public decimal PreviousReading { get; set; }
    public DateTime? PreviousReadingDate { get; set; }
    public decimal CurrentReading { get; set; }
    public DateTime CurrentReadingDate { get; set; }
    public decimal? UnitPrice { get; set; }
    public string? MeterNumber { get; set; }
    public string? PhotoUrl { get; set; }
    public string? Remarks { get; set; }
}

public class UtilitySummaryDto
{
    public Guid MoveOutOrderId { get; set; }
    public List<UtilityReadingDto> Readings { get; set; } = new();
    public decimal TotalAmount { get; set; }
}
