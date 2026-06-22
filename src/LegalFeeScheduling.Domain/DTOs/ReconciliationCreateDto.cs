using System.ComponentModel.DataAnnotations;

namespace LegalFeeScheduling.Domain.DTOs;

public class ReconciliationCreateDto
{
    [Required]
    public Guid QuoteId { get; set; }

    [Required]
    public DateTime ReconcileDate { get; set; }

    [Required]
    public decimal ExpectedAmount { get; set; }

    [Required]
    public decimal ActualAmount { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }
}
