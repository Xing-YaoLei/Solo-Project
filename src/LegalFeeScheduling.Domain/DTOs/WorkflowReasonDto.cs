using System.ComponentModel.DataAnnotations;

namespace LegalFeeScheduling.Domain.DTOs;

public class WorkflowReasonDto
{
    [MaxLength(1000)]
    public string? Reason { get; set; }
}
