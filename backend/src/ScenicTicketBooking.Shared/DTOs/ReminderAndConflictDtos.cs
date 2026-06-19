using System.ComponentModel.DataAnnotations;
using ScenicTicketBooking.Domain.Enums;

namespace ScenicTicketBooking.Shared.DTOs;

public class ReminderListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ScenicSpotId { get; set; }
    public string? ScenicSpotName { get; set; }
    public bool IsActive { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? UpdatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ReminderListItemDto> Items { get; set; } = new();
    public List<ReminderListChangeLogDto>? ChangeLogs { get; set; }
}

public class ReminderListItemDto
{
    public Guid Id { get; set; }
    public Guid ReminderListId { get; set; }
    public string PersonName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? IdCardNumber { get; set; }
    public string? Role { get; set; }
    public int SortOrder { get; set; }
    public bool ReceiveConflictNotifications { get; set; }
    public bool ReceiveDailySummary { get; set; }
    public bool ReceiveMonthlyReport { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class ReminderListChangeLogDto
{
    public Guid Id { get; set; }
    public Guid ReminderListId { get; set; }
    public Guid? ReminderListItemId { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public string FieldName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public Dictionary<string, object?>? OldValues { get; set; }
    public Dictionary<string, object?>? NewValues { get; set; }
    public string? ChangeReason { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}

public class CreateReminderListDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public Guid? ScenicSpotId { get; set; }

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    public List<ReminderListItemDto> Items { get; set; } = new();
}

public class UpdateReminderListDto
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public Guid? ScenicSpotId { get; set; }

    public bool IsActive { get; set; }

    [MaxLength(100)]
    public string? UpdatedBy { get; set; }

    [MaxLength(500)]
    public string? ChangeReason { get; set; }

    public List<ReminderListItemDto> Items { get; set; } = new();
}

public class ConflictLogDto
{
    public Guid Id { get; set; }
    public ConflictType ConflictType { get; set; }
    public string ConflictTypeText => ConflictType.ToString();
    public ConflictStatus Status { get; set; }
    public string StatusText => Status.ToString();
    public Guid? BookingId { get; set; }
    public string? BookingNo { get; set; }
    public Guid? RelatedBookingId { get; set; }
    public string? RelatedBookingNo { get; set; }
    public Guid? TimeSlotId { get; set; }
    public string? TimeSlotDisplay { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? ResolveAction { get; set; }
    public string? ResponsiblePerson { get; set; }
    public string? ProcessedBy { get; set; }
    public DateTime? NotifiedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public List<NotificationDto>? Notifications { get; set; }
}

public class ProcessConflictDto
{
    [Required]
    public ConflictStatus Status { get; set; }

    [MaxLength(1000)]
    public string? ResolveAction { get; set; }

    [MaxLength(100)]
    public string? ProcessedBy { get; set; }
}

public class NotificationDto
{
    public Guid Id { get; set; }
    public NotificationChannel Channel { get; set; }
    public string ChannelText => Channel.ToString();
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? Recipient { get; set; }
    public Guid? ConflictLogId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public bool IsSent { get; set; }
    public DateTime? SentAt { get; set; }
    public int RetryCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SendNotificationDto
{
    [Required]
    public List<Guid> ReminderListIds { get; set; } = new();

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(2000)]
    public string Content { get; set; } = string.Empty;

    public List<NotificationChannel> Channels { get; set; } = new() { NotificationChannel.System };

    [MaxLength(100)]
    public string? CreatedBy { get; set; }
}

public class ConflictDetectionResult
{
    public bool HasConflict { get; set; }
    public List<ConflictLogBriefDto> Conflicts { get; set; } = new();
    public string Summary { get; set; } = string.Empty;
}
