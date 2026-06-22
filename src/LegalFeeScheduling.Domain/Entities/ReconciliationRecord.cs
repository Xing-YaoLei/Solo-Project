using System.ComponentModel.DataAnnotations;
using LegalFeeScheduling.Domain.Common;
using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.Entities;

public class ReconciliationRecord : BaseEntity
{
    [Required]
    public Guid QuoteId { get; set; }

    [Required]
    public DateTime ReconcileDate { get; set; }

    [Required]
    public decimal ExpectedAmount { get; set; }

    [Required]
    public decimal ActualAmount { get; set; }

    [Required]
    public decimal Difference { get; set; }

    [Required]
    public ReconciliationStatus Status { get; set; }

    [MaxLength(50)]
    public string? ResolvedBy { get; set; }

    public DateTime? ResolvedAt { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }

    public Quote? Quote { get; set; }
}
