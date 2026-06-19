using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using ScenicTicketBooking.Domain.Enums;

namespace ScenicTicketBooking.Domain.Entities;

[Table("Notifications")]
public class Notification
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public NotificationChannel Channel { get; set; } = NotificationChannel.System;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Recipient { get; set; }

    public Guid? ConflictLogId { get; set; }

    [ForeignKey(nameof(ConflictLogId))]
    public virtual ConflictLog? ConflictLog { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime? ReadAt { get; set; }

    public bool IsSent { get; set; } = false;

    public DateTime? SentAt { get; set; }

    [MaxLength(500)]
    public string? SendErrorMessage { get; set; }

    public int RetryCount { get; set; } = 0;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? CreatedBy { get; set; }
}
