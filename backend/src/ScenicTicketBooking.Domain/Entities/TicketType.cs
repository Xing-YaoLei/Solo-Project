using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScenicTicketBooking.Domain.Entities;

[Table("TicketTypes")]
public class TicketType
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ScenicSpotId { get; set; }

    [ForeignKey(nameof(ScenicSpotId))]
    public virtual ScenicSpot ScenicSpot { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal Price { get; set; }

    public int SortOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<TicketBooking> Bookings { get; set; } = new List<TicketBooking>();
}
