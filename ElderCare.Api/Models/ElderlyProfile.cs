using System.ComponentModel.DataAnnotations;
using ElderCare.Api.Models.Enums;

namespace ElderCare.Api.Models;

public class ElderlyProfile
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(10)]
    public string Gender { get; set; } = string.Empty;

    [Required]
    public DateTime BirthDate { get; set; }

    [Required, StringLength(20)]
    public string RoomNumber { get; set; } = string.Empty;

    [Required]
    public int AreaId { get; set; }

    [Required]
    public int PrimaryStaffId { get; set; }

    [StringLength(500)]
    public string? HealthConditions { get; set; }

    [StringLength(100)]
    public string? EmergencyContact { get; set; }

    [StringLength(20)]
    public string? EmergencyPhone { get; set; }

    [Required]
    public DateTime AdmissionDate { get; set; }

    [Required, StringLength(20)]
    public string Status { get; set; } = "Active";

    public Area Area { get; set; } = null!;
    public Staff PrimaryStaff { get; set; } = null!;
    public ICollection<MedicationSchedule> MedicationSchedules { get; set; } = new List<MedicationSchedule>();
    public ICollection<MedicationReminderLog> MedicationReminderLogs { get; set; } = new List<MedicationReminderLog>();
    public ICollection<VisitRecord> VisitRecords { get; set; } = new List<VisitRecord>();
    public ICollection<ActivityCheckIn> ActivityCheckIns { get; set; } = new List<ActivityCheckIn>();
    public ICollection<RiskEvent> RiskEvents { get; set; } = new List<RiskEvent>();
}
