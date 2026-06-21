using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TicketDesk.Domain.Enums;

namespace TicketDesk.Domain.Entities;

public class Dispute
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid OrderId { get; set; }

    public DisputeReason Reason { get; set; }

    public DisputeStatus Status { get; set; }

    [Required]
    public string Description { get; set; } = string.Empty;

    [Required]
    public string Handler { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "jsonb")]
    public string EvidenceJson { get; set; } = string.Empty;

    public string? Resolution { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    [ForeignKey(nameof(OrderId))]
    public Order Order { get; set; } = null!;
}
