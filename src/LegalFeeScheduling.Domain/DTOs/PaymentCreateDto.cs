using System.ComponentModel.DataAnnotations;
using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.DTOs;

public class PaymentCreateDto
{
    [Required]
    public Guid QuoteId { get; set; }

    [Required]
    public decimal Amount { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    [MaxLength(100)]
    public string? BankTransactionNo { get; set; }

    [MaxLength(100)]
    public string? Payer { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }
}
