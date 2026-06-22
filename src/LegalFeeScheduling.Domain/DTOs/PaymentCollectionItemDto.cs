namespace LegalFeeScheduling.Domain.DTOs;

public class PaymentCollectionItemDto
{
    public Guid QuoteId { get; set; }

    public string QuoteNo { get; set; } = string.Empty;

    public DateTime? ExpectedDate { get; set; }

    public DateTime? FirstPaymentDate { get; set; }

    public DateTime? LastPaymentDate { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal PaidAmount { get; set; }

    public decimal OutstandingAmount { get; set; }

    public int? CollectionDays { get; set; }

    public bool FullyPaid { get; set; }
}
