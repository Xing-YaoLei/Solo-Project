using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ScenicTicketBooking.Domain.Enums;

namespace ScenicTicketBooking.Domain.Entities;

[Table("ConflictLogs")]
public class ConflictLog
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public ConflictType ConflictType { get; set; }

    [Required]
    public ConflictStatus Status { get; set; } = ConflictStatus.Detected;

    public Guid? BookingId { get; set; }

    [ForeignKey(nameof(BookingId))]
    public virtual TicketBooking? Booking { get; set; }

    public Guid? RelatedBookingId { get; set; }

    [ForeignKey(nameof(RelatedBookingId))]
    public virtual TicketBooking? RelatedBooking { get; set; }

    public Guid? TimeSlotId { get; set; }

    [ForeignKey(nameof(TimeSlotId))]
    public virtual TimeSlot? TimeSlot { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Reason { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? ResolveAction { get; set; }

    [MaxLength(200)]
    public string? ResponsiblePerson { get; set; }

    [MaxLength(100)]
    public string? ProcessedBy { get; set; }

    public DateTime? NotifiedAt { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
