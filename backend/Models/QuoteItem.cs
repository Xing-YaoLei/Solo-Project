using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarServiceAppointment.API.Models;

public class QuoteItem
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int QuoteId { get; set; }

    [ForeignKey(nameof(QuoteId))]
    public Quote? Quote { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public QuoteItemType Type { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal Subtotal { get; set; }

    [MaxLength(200)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
