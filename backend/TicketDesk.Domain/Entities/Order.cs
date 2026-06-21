using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TicketDesk.Domain.Enums;

namespace TicketDesk.Domain.Entities;

public class Order
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid EventId { get; set; }

    [Required]
    public Guid SeatId { get; set; }

    [Required]
    public Guid TicketTypeId { get; set; }

    [Required]
    public string OrderNumber { get; set; } = string.Empty;

    public OrderSource Source { get; set; }

    [Required]
    public string BuyerName { get; set; } = string.Empty;

    [Required]
    public string BuyerContact { get; set; } = string.Empty;

    public decimal TotalAmount { get; set; }

    public DocumentStatus Status { get; set; }

    [Required]
    public string Handler { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    [ForeignKey(nameof(EventId))]
    public Event Event { get; set; } = null!;

    [ForeignKey(nameof(SeatId))]
    public Seat Seat { get; set; } = null!;

    [ForeignKey(nameof(TicketTypeId))]
    public TicketType TicketType { get; set; } = null!;

    public ICollection<Dispute> Disputes { get; set; } = new List<Dispute>();
}
