using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScenicTicketBooking.Domain.Entities;

[Table("ScenicSpots")]
public class ScenicSpot
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(200)]
    public string? Address { get; set; }

    public TimeSpan OpeningTime { get; set; }

    public TimeSpan ClosingTime { get; set; }

    public int MaxDailyCapacity { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();
    public virtual ICollection<TicketType> TicketTypes { get; set; } = new List<TicketType>();
    public virtual ICollection<TicketBooking> Bookings { get; set; } = new List<TicketBooking>();
}
