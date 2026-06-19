using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ScenicTicketBooking.Domain.Enums;

namespace ScenicTicketBooking.Domain.Entities;

[Table("TicketBookings")]
public class TicketBooking
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string BookingNo { get; set; } = string.Empty;

    [Required]
    public Guid ScenicSpotId { get; set; }

    [ForeignKey(nameof(ScenicSpotId))]
    public virtual ScenicSpot ScenicSpot { get; set; } = null!;

    [Required]
    public Guid TimeSlotId { get; set; }

    [ForeignKey(nameof(TimeSlotId))]
    public virtual TimeSlot TimeSlot { get; set; } = null!;

    [Required]
    public Guid TicketTypeId { get; set; }

    [ForeignKey(nameof(TicketTypeId))]
    public virtual TicketType TicketType { get; set; } = null!;

    [Required]
    public Guid VisitorId { get; set; }

    [ForeignKey(nameof(VisitorId))]
    public virtual Visitor Visitor { get; set; } = null!;

    [Required]
    public BookingStatus Status { get; set; } = BookingStatus.Pending;

    public int Quantity { get; set; } = 1;

    [Column(TypeName = "decimal(18, 2)")]
    public decimal TotalAmount { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime? ArrivalTime { get; set; }

    [MaxLength(100)]
    public string? ArrivalOperator { get; set; }

    public DateTime? CancelledAt { get; set; }

    [MaxLength(200)]
    public string? CancellationReason { get; set; }

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? UpdatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<RescheduleRecord> RescheduleRecords { get; set; } = new List<RescheduleRecord>();
    public virtual ICollection<ConflictLog> ConflictLogs { get; set; } = new List<ConflictLog>();
}
