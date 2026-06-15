using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CertSchedulePlatform.Entities;

public class ProgressHistory
{
    [Key]
    public int Id { get; set; }

    public int LearningProgressId { get; set; }

    [ForeignKey(nameof(LearningProgressId))]
    public LearningProgress? LearningProgress { get; set; }

    public decimal OldCompletionRate { get; set; }

    public decimal NewCompletionRate { get; set; }

    public ProgressStatus OldStatus { get; set; }

    public ProgressStatus NewStatus { get; set; }

    public string? OldNote { get; set; }

    public string? NewNote { get; set; }

    public int ChangedByUserId { get; set; }

    [ForeignKey(nameof(ChangedByUserId))]
    public User? ChangedBy { get; set; }

    [MaxLength(500)]
    public string? ChangeReason { get; set; }

    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    public string? IpAddress { get; set; }
}
