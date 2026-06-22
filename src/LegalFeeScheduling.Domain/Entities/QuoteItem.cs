using System.ComponentModel.DataAnnotations;
using LegalFeeScheduling.Domain.Common;

namespace LegalFeeScheduling.Domain.Entities;

public class QuoteItem : BaseEntity
{
    [Required]
    public Guid QuoteId { get; set; }

    [Required]
    [MaxLength(200)]
    public string ItemName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public decimal UnitPrice { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    public decimal Subtotal { get; set; }

    public Quote? Quote { get; set; }
}
