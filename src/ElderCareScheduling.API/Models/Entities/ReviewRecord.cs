using ElderCareScheduling.API.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElderCareScheduling.API.Models.Entities;

public class ReviewRecord
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public ReviewType ReviewType { get; set; }

    public Guid? ScheduleId { get; set; }

    [ForeignKey(nameof(ScheduleId))]
    public virtual CareSchedule? Schedule { get; set; }

    public Guid? ExceptionRecordId { get; set; }

    [ForeignKey(nameof(ExceptionRecordId))]
    public virtual ExceptionRecord? ExceptionRecord { get; set; }

    [Required]
    public ReviewResult ReviewResult { get; set; } = ReviewResult.Pending;

    [MaxLength(2000)]
    public string? ReviewComment { get; set; }

    [MaxLength(2000)]
    public string? ImprovementSuggestions { get; set; }

    public CareStandard? CareStandardRating { get; set; }

    [Required]
    [MaxLength(50)]
    public string Reviewer { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ReviewerDepartment { get; set; }

    public DateTime? ReviewDueDate { get; set; }

    [Required]
    public DateTime ReviewedAt { get; set; } = DateTime.Now;

    public bool IsFollowUpRequired { get; set; } = false;

    public DateTime? FollowUpDueDate { get; set; }

    [MaxLength(500)]
    public string? FollowUpRequirements { get; set; }

    public bool FollowUpCompleted { get; set; } = false;

    public DateTime? FollowUpCompletedAt { get; set; }

    [MaxLength(50)]
    public string? FollowUpCompletedBy { get; set; }

    [MaxLength(1000)]
    public string? FollowUpNote { get; set; }
}
