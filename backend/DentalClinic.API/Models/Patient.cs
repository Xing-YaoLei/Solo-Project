using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DentalClinic.API.Enums;

namespace DentalClinic.API.Models;

public class Patient
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string PatientNo { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(100)]
    public string? Email { get; set; }

    public Gender Gender { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [MaxLength(200)]
    public string? Address { get; set; }

    public MemberLevel MemberLevel { get; set; }

    [MaxLength(500)]
    public string? MedicalHistory { get; set; }

    [MaxLength(500)]
    public string? AllergyHistory { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public int NoShowCount { get; set; } = 0;

    public int TotalAppointments { get; set; } = 0;

    public virtual ICollection<TreatmentPlan> TreatmentPlans { get; set; } = new List<TreatmentPlan>();
    public virtual ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public virtual ICollection<BillingRecord> BillingRecords { get; set; } = new List<BillingRecord>();
    public virtual ICollection<FollowUpTask> FollowUpTasks { get; set; } = new List<FollowUpTask>();
    public virtual ICollection<ImageAttachment> ImageAttachments { get; set; } = new List<ImageAttachment>();
}
