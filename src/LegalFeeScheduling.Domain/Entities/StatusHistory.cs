using System.ComponentModel.DataAnnotations;
using LegalFeeScheduling.Domain.Common;
using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.Entities;

public class StatusHistory : BaseEntity
{
    [Required]
    public Guid QuoteId { get; set; }

    [Required]
    public QuoteStatus FromStatus { get; set; }

    [Required]
    public QuoteStatus ToStatus { get; set; }

    [MaxLength(50)]
    public string? ChangedBy { get; set; }

    [Required]
    public DateTime ChangedAt { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }

    public Quote? Quote { get; set; }
}
