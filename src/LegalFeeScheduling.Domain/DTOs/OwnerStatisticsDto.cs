namespace LegalFeeScheduling.Domain.DTOs;

public class OwnerStatisticsDto
{
    public string Owner { get; set; } = string.Empty;

    public int QuoteCount { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal CollectedAmount { get; set; }

    public int CompletedCount { get; set; }

    public int OverdueCount { get; set; }
}
