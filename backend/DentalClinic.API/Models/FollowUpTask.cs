using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DentalClinic.API.Enums;

namespace DentalClinic.API.Models;

public class FollowUpTask
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Patient")]
    public int PatientId { get; set; }

    [ForeignKey("Appointment")]
    public int? AppointmentId { get; set; }

    [ForeignKey("TreatmentPlan")]
    public int? TreatmentPlanId { get; set; }

    public FollowUpType Type { get; set; }

    public FollowUpStatus Status { get; set; }

    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Content { get; set; }

    [MaxLength(1000)]
    public string? Result { get; set; }

    public DateTime? ScheduledDate { get; set; }

    public DateTime? CompletedAt { get; set; }

    [MaxLength(100)]
    public string? AssignedTo { get; set; }

    [MaxLength(100)]
    public string? CompletedBy { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public virtual Patient? Patient { get; set; }
    public virtual Appointment? Appointment { get; set; }
    public virtual TreatmentPlan? TreatmentPlan { get; set; }
}
