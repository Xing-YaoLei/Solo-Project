using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RehabSettlement.Api.Models;

public class Patient
{
    [Key]
    public int Id { get; set; }

    [MaxLength(50)]
    public string PatientNo { get; set; } = string.Empty;

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(10)]
    public string? Gender { get; set; }

    public DateOnly? BirthDate { get; set; }

    [MaxLength(30)]
    public string? IdCardNo { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(50)]
    public string? InsuranceType { get; set; }

    [MaxLength(50)]
    public string? InsuranceNo { get; set; }

    public int? SourceChannelId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public SourceChannel? SourceChannel { get; set; }
    public ICollection<SettlementBill> SettlementBills { get; set; } = new List<SettlementBill>();
    public ICollection<TreatmentCalendar> TreatmentCalendars { get; set; } = new List<TreatmentCalendar>();
    public ICollection<NursingLog> NursingLogs { get; set; } = new List<NursingLog>();
}

public class SourceChannel
{
    [Key]
    public int Id { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<SettlementBill> SettlementBills { get; set; } = new List<SettlementBill>();
    public ICollection<Patient> Patients { get; set; } = new List<Patient>();
}

public class ReviewTag
{
    [Key]
    public int Id { get; set; }

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Color { get; set; }

    [MaxLength(200)]
    public string? Description { get; set; }

    public ICollection<BillReviewTag> BillTags { get; set; } = new List<BillReviewTag>();
}

public class RejectionReason
{
    [Key]
    public int Id { get; set; }

    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<SettlementBill> SettlementBills { get; set; } = new List<SettlementBill>();
    public ICollection<ExceptionRecord> ExceptionRecords { get; set; } = new List<ExceptionRecord>();
}
