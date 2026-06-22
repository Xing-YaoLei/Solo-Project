namespace LegalFeeScheduling.Domain.DTOs;

public class DashboardSummaryDto
{
    public int PendingCount { get; set; }

    public int ExceptionCount { get; set; }

    public decimal MonthlyCollectedAmount { get; set; }

    public int ReconciliationDifferenceCount { get; set; }

    public int TotalQuoteCount { get; set; }

    public int CompletedQuoteCount { get; set; }

    public decimal TotalAmount { get; set; }

    public int OverdueCount { get; set; }
}
