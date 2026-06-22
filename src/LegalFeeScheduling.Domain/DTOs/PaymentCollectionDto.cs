namespace LegalFeeScheduling.Domain.DTOs;

public class PaymentCollectionDto
{
    public DateTime Date { get; set; }

    public decimal Amount { get; set; }

    public int PaymentCount { get; set; }
}
