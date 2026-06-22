using System.ComponentModel.DataAnnotations;

namespace LegalFeeScheduling.Domain.DTOs;

public class QuoteItemUpdateDto
{
    public Guid? Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string ItemName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    public decimal UnitPrice { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    public decimal Subtotal { get; set; }
}
