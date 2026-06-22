namespace LegalFeeScheduling.Domain.DTOs;

public class OwnerStatisticsDto
{
    public string Owner { get; set; } = string.Empty;

    public int QuoteCount { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal PaidAmount { get; set; }

    public decimal OutstandingAmount { get; set; }

    public int OverdueCount { get; set; }
}
