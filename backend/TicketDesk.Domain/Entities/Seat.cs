using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TicketDesk.Domain.Enums;

namespace TicketDesk.Domain.Entities;

public class Seat
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid SeatMapId { get; set; }

    [Required]
    public string Row { get; set; } = string.Empty;

    [Required]
    public string Number { get; set; } = string.Empty;

    public string? Section { get; set; }

    public SeatStatus Status { get; set; }

    public decimal Price { get; set; }

    public Guid? TicketTypeId { get; set; }

    [ForeignKey(nameof(SeatMapId))]
    public SeatMap SeatMap { get; set; } = null!;

    [ForeignKey(nameof(TicketTypeId))]
    public TicketType? TicketType { get; set; }

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
