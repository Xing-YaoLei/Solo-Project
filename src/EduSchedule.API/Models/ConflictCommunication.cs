using System.ComponentModel.DataAnnotations;

namespace EduSchedule.API.Models;

public class ConflictCommunication
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ConflictId { get; set; }
    public Conflict Conflict { get; set; } = null!;

    [Required]
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    [MaxLength(2000)]
    public string Message { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? AttachmentUrl { get; set; }

    public CommunicationType Type { get; set; } = CommunicationType.Comment;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum CommunicationType
{
    Comment,
    Notification,
    Email,
    Meeting,
    Decision
}
