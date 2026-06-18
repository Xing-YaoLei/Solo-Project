using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CarServiceAppointment.API.Models;

public class PartsShortageRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AppointmentId { get; set; }

    [ForeignKey(nameof(AppointmentId))]
    public Appointment? Appointment { get; set; }

    [Required]
    public int PartsId { get; set; }

    [ForeignKey(nameof(PartsId))]
    public Parts? Parts { get; set; }

    public int ShortageQuantity { get; set; }

    public DateTime? ExpectedArrivalTime { get; set; }

    public DateTime? ActualArrivalTime { get; set; }

    public PartsShortageStatus Status { get; set; }

    [MaxLength(50)]
    public string? Handler { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
