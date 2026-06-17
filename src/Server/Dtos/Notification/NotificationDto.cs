using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Dtos.Notification;

public class NotificationRecordDto
{
    public int Id { get; set; }
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string TypeText { get; set; } = string.Empty;
    public NotificationChannel Channel { get; set; }
    public string ChannelText { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? RecipientEmail { get; set; }
    public int? RecipientPersonId { get; set; }
    public NotificationStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public int RetryCount { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? FailureReason { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpireAt { get; set; }
}

public class NotificationQueryDto : PagedQuery
{
    public int? SiteId { get; set; }
    public NotificationType? Type { get; set; }
    public NotificationStatus? Status { get; set; }
    public string? RecipientName { get; set; }
    public DateTime? CreatedFrom { get; set; }
    public DateTime? CreatedTo { get; set; }
}

public class NotificationCreateDto
{
    public int SiteId { get; set; }
    public NotificationType Type { get; set; }
    public NotificationChannel Channel { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? RecipientName { get; set; }
    public string? RecipientPhone { get; set; }
    public string? RecipientEmail { get; set; }
    public int? RecipientPersonId { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? ExpireAt { get; set; }
}
