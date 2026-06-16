using System.ComponentModel.DataAnnotations;
using ElderCare.Api.Models.Enums;

namespace ElderCare.Api.DTOs;

public class CreateScheduleDto
{
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
    public int CreatedByStaffId { get; set; }
}

public class UpdateScheduleDto
{
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
    public MedicationStatus Status { get; set; }
}

public class ScheduleDto
{
    public int Id { get; set; }
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public int MedicationDictId { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Dosage { get; set; } = string.Empty;
    public string Frequency { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string TimeOfDay { get; set; } = string.Empty;
    public string? Instructions { get; set; }
    public string Status { get; set; } = string.Empty;
    public int CreatedByStaffId { get; set; }
    public string CreatedByStaffName { get; set; } = string.Empty;
}

public class AcknowledgeReminderDto
{
    [Required]
    public int AcknowledgedByStaffId { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}

public class ReminderLogDto
{
    public int Id { get; set; }
    public int ScheduleId { get; set; }
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public DateTime ReminderTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? AcknowledgedAt { get; set; }
    public int? AcknowledgedByStaffId { get; set; }
    public string? AcknowledgedByStaffName { get; set; }
    public string? Notes { get; set; }
}
