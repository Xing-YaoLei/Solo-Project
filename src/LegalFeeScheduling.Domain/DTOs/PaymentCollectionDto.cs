namespace LegalFeeScheduling.Domain.DTOs;

public class PaymentCollectionDto
{
    public int TotalQuotes { get; set; }

    public int FullyPaidCount { get; set; }

    public int PartiallyPaidCount { get; set; }

    public int NotPaidCount { get; set; }

    public double AverageCollectionDays { get; set; }

    public List<PaymentCollectionItemDto> Details { get; set; } = new();
}
