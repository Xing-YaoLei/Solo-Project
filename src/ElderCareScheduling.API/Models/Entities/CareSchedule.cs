using ElderCareScheduling.API.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElderCareScheduling.API.Models.Entities;

public class CareSchedule
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string ScheduleNo { get; set; } = string.Empty;

    [Required]
    public Guid ElderId { get; set; }

    [ForeignKey(nameof(ElderId))]
    public virtual Elder? Elder { get; set; }

    public Guid? BedId { get; set; }

    [ForeignKey(nameof(BedId))]
    public virtual Bed? Bed { get; set; }

    public Guid? CareLevelId { get; set; }

    [ForeignKey(nameof(CareLevelId))]
    public virtual CareLevel? CareLevel { get; set; }

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public ShiftType ShiftType { get; set; }

    [MaxLength(200)]
    public string? PrimaryNurse { get; set; }

    [MaxLength(200)]
    public string? SecondaryNurse { get; set; }

    [MaxLength(200)]
    public string? DoctorOnDuty { get; set; }

    [MaxLength(2000)]
    public string? CarePlan { get; set; }

    [MaxLength(2000)]
    public string? SpecialRequirements { get; set; }

    [MaxLength(2000)]
    public string? NutritionPlan { get; set; }

    [MaxLength(2000)]
    public string? RehabilitationPlan { get; set; }

    [MaxLength(1000)]
    public string? DailySchedule { get; set; }

    public ScheduleStatus Status { get; set; } = ScheduleStatus.Draft;

    [MaxLength(2000)]
    public string? ProcessingNotes { get; set; }

    [MaxLength(2000)]
    public string? ReviewComments { get; set; }

    [MaxLength(2000)]
    public string? PostReviewSummary { get; set; }

    public CareStandard CareStandard { get; set; } = CareStandard.NotEvaluated;

    public virtual ICollection<ReviewRecord> ReviewRecords { get; set; } = new List<ReviewRecord>();

    public virtual ICollection<ExceptionRecord> ExceptionRecords { get; set; } = new List<ExceptionRecord>();

    public virtual ICollection<ScheduleStatusHistory> StatusHistories { get; set; } = new List<ScheduleStatusHistory>();

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Required]
    [MaxLength(50)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? SubmittedAt { get; set; }

    [MaxLength(50)]
    public string? SubmittedBy { get; set; }

    public DateTime? ReviewedAt { get; set; }

    [MaxLength(50)]
    public string? ReviewedBy { get; set; }

    public DateTime? StartedAt { get; set; }

    [MaxLength(50)]
    public string? StartedBy { get; set; }

    public DateTime? CompletedAt { get; set; }

    [MaxLength(50)]
    public string? CompletedBy { get; set; }

    public DateTime? PostReviewedAt { get; set; }

    [MaxLength(50)]
    public string? PostReviewedBy { get; set; }

    public DateTime? ClosedAt { get; set; }

    [MaxLength(50)]
    public string? ClosedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [MaxLength(50)]
    public string? UpdatedBy { get; set; }

    public bool IsArchived { get; set; } = false;

    public DateTime? ArchivedAt { get; set; }
}
