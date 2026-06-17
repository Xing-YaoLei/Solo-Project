using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SiteSchedule.Models;

public enum NotificationType
{
    MaterialMissing = 1,
    ConfirmationReminder = 2,
    StatusChange = 3,
    DeadlineWarning = 4,
    SystemNotice = 99
}

public enum NotificationChannel
{
    System = 1,
    Sms = 2,
    Email = 3,
    WeChat = 4
}

public enum NotificationStatus
{
    Pending = 0,
    Sent = 1,
    Failed = 2,
    Read = 3
}

public class NotificationRecord
{
    [Key]
    public int Id { get; set; }

    public int SiteId { get; set; }

    [ForeignKey(nameof(SiteId))]
    public virtual ConstructionSite Site { get; set; } = null!;

    public NotificationType Type { get; set; }

    public NotificationChannel Channel { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Content { get; set; }

    [MaxLength(50)]
    public string? RecipientName { get; set; }

    [MaxLength(50)]
    public string? RecipientPhone { get; set; }

    [MaxLength(100)]
    public string? RecipientEmail { get; set; }

    public int? RecipientPersonId { get; set; }

    [ForeignKey(nameof(RecipientPersonId))]
    public virtual PersonInCharge? RecipientPerson { get; set; }

    public NotificationStatus Status { get; set; } = NotificationStatus.Pending;

    public int RetryCount { get; set; } = 0;

    public DateTime? SentAt { get; set; }

    public DateTime? ReadAt { get; set; }

    [MaxLength(500)]
    public string? FailureReason { get; set; }

    [MaxLength(50)]
    public string? CreatedBy { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? ExpireAt { get; set; }
}
