using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.DTOs;

public class StatusChangeSummaryDto
{
    public QuoteStatus Status { get; set; }

    public int Count { get; set; }

    public decimal TotalAmount { get; set; }
}
