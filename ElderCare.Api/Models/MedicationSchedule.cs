using System.ComponentModel.DataAnnotations;
using ElderCare.Api.Models.Enums;

namespace ElderCare.Api.Models;

public class MedicationSchedule
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ElderlyId { get; set; }

    [Required]
    public int MedicationDictId { get; set; }

    [Required, StringLength(100)]
    public string Dosage { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string Frequency { get; set; } = string.Empty;

    [Required]
    public DateTime StartTime { get; set; }

    public DateTime? EndTime { get; set; }

    [Required, StringLength(200)]
    public string TimeOfDay { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Instructions { get; set; }

    [Required]
    public MedicationStatus Status { get; set; } = MedicationStatus.Active;

    [Required]
    public int CreatedByStaffId { get; set; }

    public ElderlyProfile Elderly { get; set; } = null!;
    public MedicationDictionary MedicationDict { get; set; } = null!;
    public Staff CreatedByStaff { get; set; } = null!;
    public ICollection<MedicationReminderLog> ReminderLogs { get; set; } = new List<MedicationReminderLog>();
}
