using System.ComponentModel.DataAnnotations;

namespace LegalFeeScheduling.Domain.DTOs;

public class ReconciliationResolveDto
{
    [Required]
    [MaxLength(1000)]
    public string Remarks { get; set; } = string.Empty;
}
