using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CertSchedulePlatform.Entities;

public class AssignmentRecord
{
    [Key]
    public int Id { get; set; }

    public int AssignmentId { get; set; }

    [ForeignKey(nameof(AssignmentId))]
    public Assignment? Assignment { get; set; }

    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    public int CorrectCount { get; set; }

    public int TotalQuestions { get; set; }

    public decimal Score { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? SubmittedAt { get; set; }

    public RecordStatus Status { get; set; } = RecordStatus.NotStarted;

    [MaxLength(1000)]
    public string? Remark { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}

public enum RecordStatus
{
    NotStarted = 0,
    InProgress = 1,
    Submitted = 2,
    Reviewed = 3
}
