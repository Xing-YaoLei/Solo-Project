using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScenicTicketBooking.Domain.Entities;

[Table("RescheduleRecords")]
public class RescheduleRecord
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid BookingId { get; set; }

    [ForeignKey(nameof(BookingId))]
    public virtual TicketBooking Booking { get; set; } = null!;

    [Required]
    public Guid OriginalTimeSlotId { get; set; }

    [ForeignKey(nameof(OriginalTimeSlotId))]
    public virtual TimeSlot OriginalTimeSlot { get; set; } = null!;

    [Required]
    public Guid NewTimeSlotId { get; set; }

    [ForeignKey(nameof(NewTimeSlotId))]
    public virtual TimeSlot NewTimeSlot { get; set; } = null!;

    [MaxLength(500)]
    public string? Reason { get; set; }

    [MaxLength(100)]
    public string? Operator { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [NotMapped]
    public string OriginalTimeSlotDisplay => $"{OriginalTimeSlot.Date:yyyy-MM-dd} {OriginalTimeSlot.StartTime:hh\\:mm}-{OriginalTimeSlot.EndTime:hh\\:mm}";

    [NotMapped]
    public string NewTimeSlotDisplay => $"{NewTimeSlot.Date:yyyy-MM-dd} {NewTimeSlot.StartTime:hh\\:mm}-{NewTimeSlot.EndTime:hh\\:mm}";
}
