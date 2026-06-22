using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.DTOs;

public class PeriodSummaryDto
{
    public string Period { get; set; } = string.Empty;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int TotalQuotes { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal TotalPaid { get; set; }

    public int CompletedCount { get; set; }

    public int ExceptionCount { get; set; }

    public List<StatusBreakdownItem> StatusBreakdown { get; set; } = new();
}

public class StatusBreakdownItem
{
    public QuoteStatus Status { get; set; }

    public int Count { get; set; }

    public decimal Amount { get; set; }
}
