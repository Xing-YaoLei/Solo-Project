using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.DTOs;

public class StatusChangeSummaryDto
{
    public int PeriodDays { get; set; }

    public int TotalChanges { get; set; }

    public List<StatusTransitionItem> Transitions { get; set; } = new();

    public List<StatusChangeByDateItem> ByDate { get; set; } = new();
}

public class StatusTransitionItem
{
    public QuoteStatus FromStatus { get; set; }

    public QuoteStatus ToStatus { get; set; }

    public int Count { get; set; }
}

public class StatusChangeByDateItem
{
    public DateTime Date { get; set; }

    public int Count { get; set; }
}
