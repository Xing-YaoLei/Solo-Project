using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarServiceAppointment.API.Models;

public class InspectionPhoto
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AppointmentId { get; set; }

    [ForeignKey(nameof(AppointmentId))]
    public Appointment? Appointment { get; set; }

    [Required]
    [MaxLength(500)]
    public string PhotoUrl { get; set; } = string.Empty;

    public PhotoType PhotoType { get; set; }

    public DateTime UploadTime { get; set; } = DateTime.Now;

    [MaxLength(50)]
    public string? Uploader { get; set; }

    [MaxLength(200)]
    public string? Remarks { get; set; }
}
