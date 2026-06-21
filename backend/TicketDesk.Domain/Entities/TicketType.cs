using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TicketDesk.Domain.Entities;

public class TicketType
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid EventId { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public int Quota { get; set; }

    public int SoldCount { get; set; }

    [Required]
    [Column(TypeName = "jsonb")]
    public string RulesJson { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    [ForeignKey(nameof(EventId))]
    public Event Event { get; set; } = null!;

    public ICollection<Seat> Seats { get; set; } = new List<Seat>();
}
