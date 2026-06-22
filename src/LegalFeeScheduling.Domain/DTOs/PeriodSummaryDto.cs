namespace LegalFeeScheduling.Domain.DTOs;

public class PeriodSummaryDto
{
    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public int NewQuoteCount { get; set; }

    public int CompletedQuoteCount { get; set; }

    public decimal CollectedAmount { get; set; }

    public int ExceptionCount { get; set; }
}
