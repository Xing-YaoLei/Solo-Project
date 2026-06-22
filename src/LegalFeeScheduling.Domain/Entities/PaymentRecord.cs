using System.ComponentModel.DataAnnotations;
using LegalFeeScheduling.Domain.Common;
using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.Entities;

public class PaymentRecord : BaseEntity
{
    [Required]
    public Guid QuoteId { get; set; }

    [Required]
    [MaxLength(50)]
    public string PaymentNo { get; set; } = string.Empty;

    [Required]
    public decimal Amount { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    [Required]
    public PaymentStatus Status { get; set; }

    [MaxLength(100)]
    public string? BankTransactionNo { get; set; }

    [MaxLength(100)]
    public string? Payer { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }

    [Required]
    [MaxLength(50)]
    public string CreatedBy { get; set; } = string.Empty;

    public Quote? Quote { get; set; }
}
