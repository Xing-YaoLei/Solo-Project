using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TicketDesk.Domain.Enums;

namespace TicketDesk.Domain.Entities;

public class AllocationDocument
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public string DocumentNumber { get; set; } = string.Empty;

    [Required]
    public Guid EventId { get; set; }

    public DocumentStatus Status { get; set; }

    [Required]
    public string Handler { get; set; } = string.Empty;

    public string Notes { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    [ForeignKey(nameof(EventId))]
    public Event Event { get; set; } = null!;

    public ICollection<Order> Orders { get; set; } = new List<Order>();

    public ICollection<Dispute> Disputes { get; set; } = new List<Dispute>();
}
