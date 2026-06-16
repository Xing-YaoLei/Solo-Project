using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DentalClinic.API.Enums;

namespace DentalClinic.API.Models;

public class Appointment
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Patient")]
    public int PatientId { get; set; }

    [ForeignKey("TreatmentPlan")]
    public int? TreatmentPlanId { get; set; }

    [Required]
    public DateTime AppointmentDate { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }

    [Required]
    public TimeSpan EndTime { get; set; }

    [MaxLength(200)]
    public string? Subject { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    public AppointmentStatus Status { get; set; }

    [MaxLength(100)]
    public string? DoctorName { get; set; }

    [MaxLength(100)]
    public string? AssistantName { get; set; }

    [MaxLength(100)]
    public string? ChairNumber { get; set; }

    public RiskLevel RiskLevel { get; set; }

    public int? NoShowCount { get; set; }

    [MaxLength(500)]
    public string? CommunicationNotes { get; set; }

    [MaxLength(500)]
    public string? ReviewComments { get; set; }

    public DateTime? ReminderSentAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public virtual Patient? Patient { get; set; }
    public virtual TreatmentPlan? TreatmentPlan { get; set; }
    public virtual ICollection<FollowUpTask> FollowUpTasks { get; set; } = new List<FollowUpTask>();
    public virtual ICollection<ImageAttachment> ImageAttachments { get; set; } = new List<ImageAttachment>();
    public virtual ICollection<BillingRecord> BillingRecords { get; set; } = new List<BillingRecord>();
}
