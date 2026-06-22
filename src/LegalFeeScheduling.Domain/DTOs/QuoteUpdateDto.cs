using System.ComponentModel.DataAnnotations;
using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.DTOs;

public class QuoteUpdateDto
{
    [Required]
    [MaxLength(200)]
    public string CaseName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ClientName { get; set; } = string.Empty;

    [Required]
    public Channel Channel { get; set; }

    [Required]
    public decimal Amount { get; set; }

    public decimal DiscountAmount { get; set; }

    [Required]
    public decimal FinalAmount { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }

    public DateTime? ExpectedPaymentDate { get; set; }

    [MaxLength(50)]
    public string? Owner { get; set; }

    public ICollection<QuoteItemUpdateDto> Items { get; set; } = new List<QuoteItemUpdateDto>();
}
