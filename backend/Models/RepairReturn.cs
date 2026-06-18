using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarServiceAppointment.API.Models;

public class RepairReturn
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int OriginalAppointmentId { get; set; }

    [ForeignKey(nameof(OriginalAppointmentId))]
    public Appointment? OriginalAppointment { get; set; }

    [Required]
    public int NewAppointmentId { get; set; }

    [ForeignKey(nameof(NewAppointmentId))]
    public Appointment? NewAppointment { get; set; }

    [Required]
    [MaxLength(500)]
    public string ReturnReason { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Conclusion { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
