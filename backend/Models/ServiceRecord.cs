using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarServiceAppointment.API.Models;

public class ServiceRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AppointmentId { get; set; }

    [ForeignKey(nameof(AppointmentId))]
    public Appointment? Appointment { get; set; }

    [Required]
    [MaxLength(200)]
    public string ServiceItem { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ServicePerson { get; set; }

    public DateTime? StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    [MaxLength(500)]
    public string? Conclusion { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
