using System.ComponentModel.DataAnnotations;
using LegalFeeScheduling.Domain.Common;
using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.Entities;

public class AmountCheckResult : BaseEntity
{
    [Required]
    public Guid QuoteId { get; set; }

    [Required]
    public AmountCheckType CheckType { get; set; }

    [Required]
    public decimal ExpectedAmount { get; set; }

    [Required]
    public decimal ActualAmount { get; set; }

    [Required]
    public decimal Difference { get; set; }

    [Required]
    public bool IsMatch { get; set; }

    [Required]
    public DateTime CheckedAt { get; set; }

    [MaxLength(50)]
    public string? CheckedBy { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }

    public Quote? Quote { get; set; }
}
