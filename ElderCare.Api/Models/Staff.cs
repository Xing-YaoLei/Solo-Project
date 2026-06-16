using System.ComponentModel.DataAnnotations;

namespace ElderCare.Api.Models;

public class Staff
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(50)]
    public string Role { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(100)]
    public string? Email { get; set; }

    [Required]
    public int AreaId { get; set; }

    public Area Area { get; set; } = null!;
    public ICollection<ElderlyProfile> PrimaryElderlyProfiles { get; set; } = new List<ElderlyProfile>();
    public ICollection<MedicationSchedule> CreatedMedicationSchedules { get; set; } = new List<MedicationSchedule>();
    public ICollection<MedicationReminderLog> AcknowledgedReminderLogs { get; set; } = new List<MedicationReminderLog>();
    public ICollection<VisitRecord> VisitRecords { get; set; } = new List<VisitRecord>();
    public ICollection<ActivityCheckIn> ActivityCheckIns { get; set; } = new List<ActivityCheckIn>();
    public ICollection<RiskEvent> ReportedRiskEvents { get; set; } = new List<RiskEvent>();
    public ICollection<RiskEvent> AssignedRiskEvents { get; set; } = new List<RiskEvent>();
    public ICollection<RiskEventReminder> RiskEventReminders { get; set; } = new List<RiskEventReminder>();
}
