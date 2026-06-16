using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DentalClinic.API.Models;

public class ImageAttachment
{
    [Key]
    public int Id { get; set; }

    [ForeignKey("Patient")]
    public int PatientId { get; set; }

    [ForeignKey("Appointment")]
    public int? AppointmentId { get; set; }

    [ForeignKey("TreatmentPlan")]
    public int? TreatmentPlanId { get; set; }

    [MaxLength(200)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? FilePath { get; set; }

    [MaxLength(50)]
    public string? FileType { get; set; }

    public long FileSize { get; set; }

    [MaxLength(200)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.Now;

    [MaxLength(100)]
    public string? UploadedBy { get; set; }

    public virtual Patient? Patient { get; set; }
    public virtual Appointment? Appointment { get; set; }
    public virtual TreatmentPlan? TreatmentPlan { get; set; }
}
