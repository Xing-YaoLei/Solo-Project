using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScenicTicketBooking.Domain.Entities;

[Table("TimeSlots")]
public class TimeSlot
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ScenicSpotId { get; set; }

    [ForeignKey(nameof(ScenicSpotId))]
    public virtual ScenicSpot ScenicSpot { get; set; } = null!;

    [Required]
    public DateOnly Date { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeSpan EndTime { get; set; }

    public int Capacity { get; set; }

    public int BookedCount { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<TicketBooking> Bookings { get; set; } = new List<TicketBooking>();

    [NotMapped]
    public int AvailableCount => Capacity - BookedCount;

    [NotMapped]
    public bool IsFull => BookedCount >= Capacity;
}
