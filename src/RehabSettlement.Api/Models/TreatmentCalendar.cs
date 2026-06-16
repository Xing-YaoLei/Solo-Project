using System.ComponentModel.DataAnnotations;

namespace RehabSettlement.Api.Models;

public class TreatmentCalendar
{
    [Key]
    public int Id { get; set; }

    public int BillId { get; set; }

    public int PatientId { get; set; }

    public DateOnly TreatmentDate { get; set; }

    public TimeOnly? StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    [MaxLength(100)]
    public string? TreatmentType { get; set; }

    [MaxLength(200)]
    public string? TreatmentItem { get; set; }

    public int? DoctorId { get; set; }

    public int? TherapistId { get; set; }

    public int StatusId { get; set; } = 1;

    public int? Duration { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public SettlementBill? Bill { get; set; }
    public Patient? Patient { get; set; }
    public User? Doctor { get; set; }
    public User? Therapist { get; set; }
    public ICollection<DeviceUsageRecord> DeviceUsageRecords { get; set; } = new List<DeviceUsageRecord>();
    public ICollection<NursingLog> NursingLogs { get; set; } = new List<NursingLog>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
