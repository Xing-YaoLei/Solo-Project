using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SiteSchedule.Models;

public enum SubmissionStatus
{
    Pending = 0,
    Submitted = 1,
    Approved = 2,
    Rejected = 3,
    SupplementRequired = 4
}

public class MaterialSubmission
{
    [Key]
    public int Id { get; set; }

    public int SiteId { get; set; }

    [ForeignKey(nameof(SiteId))]
    public virtual ConstructionSite Site { get; set; } = null!;

    public int? ConfirmationId { get; set; }

    [ForeignKey(nameof(ConfirmationId))]
    public virtual ScheduleConfirmation? Confirmation { get; set; }

    public int MaterialId { get; set; }

    [ForeignKey(nameof(MaterialId))]
    public virtual AttachmentMaterial Material { get; set; } = null!;

    public SubmissionStatus Status { get; set; } = SubmissionStatus.Pending;

    [MaxLength(500)]
    public string? FilePath { get; set; }

    [MaxLength(200)]
    public string? FileName { get; set; }

    public long? FileSize { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }

    public DateTime? SubmittedAt { get; set; }

    [MaxLength(50)]
    public string? SubmittedBy { get; set; }

    public DateTime? ReviewedAt { get; set; }

    [MaxLength(50)]
    public string? ReviewedBy { get; set; }

    [MaxLength(500)]
    public string? ReviewComment { get; set; }

    public int RetryCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
