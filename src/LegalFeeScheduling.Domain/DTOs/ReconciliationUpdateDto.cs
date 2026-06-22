using System.ComponentModel.DataAnnotations;
using LegalFeeScheduling.Domain.Enums;

namespace LegalFeeScheduling.Domain.DTOs;

public class ReconciliationUpdateDto
{
    [Required]
    public DateTime ReconcileDate { get; set; }

    [Required]
    public decimal ExpectedAmount { get; set; }

    [Required]
    public decimal ActualAmount { get; set; }

    [Required]
    public ReconciliationStatus Status { get; set; }

    [MaxLength(1000)]
    public string? Remarks { get; set; }
}
