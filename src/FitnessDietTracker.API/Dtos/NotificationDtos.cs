using FitnessDietTracker.API.Enums;

namespace FitnessDietTracker.API.Dtos;

public class NotificationDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int? RelatedId { get; set; }
    public string? RelatedType { get; set; }
    public NotificationStatus Status { get; set; }
    public DateTime? ReadAt { get; set; }
    public int? CreatedBy { get; set; }
    public string? CreatedByName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateNotificationDto
{
    public int UserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int? RelatedId { get; set; }
    public string? RelatedType { get; set; }
    public int? CreatedBy { get; set; }
}
