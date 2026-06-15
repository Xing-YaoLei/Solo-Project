using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CertSchedulePlatform.Entities;

public class LearningProgress
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    public int CertificateId { get; set; }

    [ForeignKey(nameof(CertificateId))]
    public Certificate? Certificate { get; set; }

    public int? CourseId { get; set; }

    [ForeignKey(nameof(CourseId))]
    public Course? Course { get; set; }

    public decimal CompletionRate { get; set; }

    public decimal TargetRate { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? TargetDate { get; set; }

    public ProgressStatus Status { get; set; } = ProgressStatus.NotStarted;

    [MaxLength(500)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<ProgressHistory> ProgressHistories { get; set; } = new List<ProgressHistory>();

    public ICollection<ProgressAlert> ProgressAlerts { get; set; } = new List<ProgressAlert>();
}

public enum ProgressStatus
{
    NotStarted = 0,
    InProgress = 1,
    OnTrack = 2,
    Behind = 3,
    Completed = 4,
    Paused = 5
}
