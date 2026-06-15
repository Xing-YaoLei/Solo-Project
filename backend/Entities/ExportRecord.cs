using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CertSchedulePlatform.Entities;

public class ExportRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string FileName { get; set; } = string.Empty;

    public ExportType ExportType { get; set; }

    [MaxLength(2000)]
    public string? FilterCriteria { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public int TotalRecords { get; set; }

    [MaxLength(500)]
    public string? FilePath { get; set; }

    public int GeneratedByUserId { get; set; }

    [ForeignKey(nameof(GeneratedByUserId))]
    public User? GeneratedBy { get; set; }

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ExpiresAt { get; set; }
}

public enum ExportType
{
    LearningProgress = 1,
    MonthlyReview = 2,
    AssignmentRecords = 3,
    Alerts = 4
}
