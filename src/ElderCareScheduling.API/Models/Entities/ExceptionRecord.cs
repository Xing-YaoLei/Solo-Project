using ElderCareScheduling.API.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElderCareScheduling.API.Models.Entities;

public class ExceptionRecord
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string ExceptionNo { get; set; } = string.Empty;

    [Required]
    public Guid ScheduleId { get; set; }

    [ForeignKey(nameof(ScheduleId))]
    public virtual CareSchedule? Schedule { get; set; }

    [Required]
    public Guid ElderId { get; set; }

    [ForeignKey(nameof(ElderId))]
    public virtual Elder? Elder { get; set; }

    [Required]
    public ExceptionType ExceptionType { get; set; } = ExceptionType.Fall;

    [Required]
    public ExceptionSeverity Severity { get; set; }

    [Required]
    public ExceptionStatus Status { get; set; } = ExceptionStatus.Reported;

    public ExceptionCloseType? CloseType { get; set; }

    [Required]
    public DateTime OccurredAt { get; set; }

    [MaxLength(200)]
    public string? OccurredLocation { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Description { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? FallSceneDescription { get; set; }

    [MaxLength(500)]
    public string? FallCause { get; set; }

    [MaxLength(500)]
    public string? FallHeight { get; set; }

    [MaxLength(500)]
    public string? InjuredPart { get; set; }

    [MaxLength(500)]
    public string? InitialSymptoms { get; set; }

    [MaxLength(2000)]
    public string? OnSiteMeasures { get; set; }

    [MaxLength(2000)]
    public string? InvestigationResult { get; set; }

    [MaxLength(2000)]
    public string? HandlingMeasures { get; set; }

    [MaxLength(2000)]
    public string? TreatmentResult { get; set; }

    [MaxLength(2000)]
    public string? RootCauseAnalysis { get; set; }

    [MaxLength(2000)]
    public string? CorrectiveActions { get; set; }

    [MaxLength(2000)]
    public string? PreventiveMeasures { get; set; }

    [MaxLength(2000)]
    public string? SupplementMaterialDescription { get; set; }

    [MaxLength(500)]
    public string? SupplementRequirement { get; set; }

    public DateTime? SupplementDueDate { get; set; }

    public bool SupplementReceived { get; set; } = false;

    public DateTime? SupplementReceivedAt { get; set; }

    [MaxLength(50)]
    public string? SupplementReceivedBy { get; set; }

    [MaxLength(500)]
    public string? EscalationReason { get; set; }

    public DateTime? EscalatedAt { get; set; }

    [MaxLength(50)]
    public string? EscalatedBy { get; set; }

    [MaxLength(100)]
    public string? EscalatedTo { get; set; }

    [MaxLength(2000)]
    public string? EscalationResponse { get; set; }

    [MaxLength(2000)]
    public string? FinalConclusion { get; set; }

    [MaxLength(1000)]
    public string? LessonsLearned { get; set; }

    public virtual ICollection<ReviewRecord> ReviewRecords { get; set; } = new List<ReviewRecord>();

    public virtual ICollection<ExceptionAttachment> Attachments { get; set; } = new List<ExceptionAttachment>();

    public virtual ICollection<ExceptionStatusHistory> StatusHistories { get; set; } = new List<ExceptionStatusHistory>();

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Required]
    [MaxLength(50)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? ReportedAt { get; set; }

    [MaxLength(50)]
    public string? ReportedBy { get; set; }

    public DateTime? AssignedAt { get; set; }

    [MaxLength(50)]
    public string? AssignedTo { get; set; }

    [MaxLength(50)]
    public string? AssignedBy { get; set; }

    public DateTime? InvestigationStartedAt { get; set; }

    [MaxLength(50)]
    public string? Investigator { get; set; }

    public DateTime? ResolvedAt { get; set; }

    [MaxLength(50)]
    public string? ResolvedBy { get; set; }

    public DateTime? ClosedAt { get; set; }

    [MaxLength(50)]
    public string? ClosedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [MaxLength(50)]
    public string? UpdatedBy { get; set; }
}
