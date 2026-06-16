using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DentalClinic.API.Enums;

namespace DentalClinic.API.Models;

public class TreatmentPlan
{
    [Key]
    public int Id { get; set; }

    [Required]
    [ForeignKey("Patient")]
    public int PatientId { get; set; }

    [Required]
    [MaxLength(200)]
    public string PlanName { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public TreatmentStatus Status { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? ExpectedEndDate { get; set; }

    public DateTime? ActualEndDate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal EstimatedCost { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ActualCost { get; set; }

    [MaxLength(200)]
    public string? DoctorName { get; set; }

    [MaxLength(200)]
    public string? AssistantName { get; set; }

    public int? TotalVisits { get; set; }

    public int CompletedVisits { get; set; } = 0;

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public virtual Patient? Patient { get; set; }
    public virtual ICollection<TreatmentPlanItem> PlanItems { get; set; } = new List<TreatmentPlanItem>();
    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
}

public class TreatmentPlanItem
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("TreatmentPlan")]
    public int TreatmentPlanId { get; set; }

    [MaxLength(200)]
    public string ItemName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public int Sequence { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    public int Quantity { get; set; } = 1;

    public bool IsCompleted { get; set; } = false;

    public DateTime? CompletedAt { get; set; }

    public virtual TreatmentPlan? TreatmentPlan { get; set; }
}
