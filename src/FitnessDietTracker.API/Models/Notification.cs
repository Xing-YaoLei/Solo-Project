using FitnessDietTracker.API.Enums;

namespace FitnessDietTracker.API.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int? RelatedId { get; set; }
    public string? RelatedType { get; set; }
    public NotificationStatus Status { get; set; } = NotificationStatus.Unread;
    public DateTime? ReadAt { get; set; }
    public int? CreatedBy { get; set; }
    public User? Creator { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
