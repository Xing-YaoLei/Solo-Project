using System.ComponentModel.DataAnnotations;
using LegalFeeScheduling.Domain.Common;
using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.Entities;

public class Quote : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string QuoteNo { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string CaseName { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string ClientName { get; set; } = string.Empty;

    [Required]
    public Channel Channel { get; set; }

    public decimal Amount { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal FinalAmount { get; set; }

    [Required]
    public QuoteStatus Status { get; set; }

    [Required]
    [MaxLength(50)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? ApprovedAt { get; set; }

    [MaxLength(50)]
    public string? ApprovedBy { get; set; }

    public DateTime? CompletedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }

    public DateTime? ExpectedPaymentDate { get; set; }

    [MaxLength(50)]
    public string? Owner { get; set; }

    public ICollection<QuoteItem> Items { get; set; } = new List<QuoteItem>();

    public ICollection<PaymentRecord> Payments { get; set; } = new List<PaymentRecord>();

    public ICollection<ReconciliationRecord> Reconciliations { get; set; } = new List<ReconciliationRecord>();

    public ICollection<StatusHistory> StatusHistories { get; set; } = new List<StatusHistory>();

    public ICollection<AmountCheckResult> AmountChecks { get; set; } = new List<AmountCheckResult>();
}
