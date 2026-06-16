using System.ComponentModel.DataAnnotations;

namespace RehabSettlement.Api.Models;

public class NursingLog
{
    [Key]
    public int Id { get; set; }

    public int? BillId { get; set; }

    public int PatientId { get; set; }

    public int? TreatmentCalendarId { get; set; }

    public DateOnly LogDate { get; set; }

    public TimeOnly? LogTime { get; set; }

    public int? NurseId { get; set; }

    [MaxLength(500)]
    public string? VitalSigns { get; set; }

    [MaxLength(1000)]
    public string? NursingContent { get; set; }

    [MaxLength(500)]
    public string? PatientCondition { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public SettlementBill? Bill { get; set; }
    public Patient? Patient { get; set; }
    public TreatmentCalendar? TreatmentCalendar { get; set; }
    public User? Nurse { get; set; }
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
