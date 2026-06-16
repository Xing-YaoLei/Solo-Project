using System.ComponentModel.DataAnnotations;
using ElderCare.Api.Models.Enums;

namespace ElderCare.Api.Models;

public class MedicationReminderLog
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ScheduleId { get; set; }

    [Required]
    public int ElderlyId { get; set; }

    [Required]
    public DateTime ReminderTime { get; set; }

    [Required]
    public ReminderStatus Status { get; set; } = ReminderStatus.Pending;

    public DateTime? AcknowledgedAt { get; set; }

    public int? AcknowledgedByStaffId { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public MedicationSchedule Schedule { get; set; } = null!;
    public ElderlyProfile Elderly { get; set; } = null!;
    public Staff? AcknowledgedByStaff { get; set; }
}
