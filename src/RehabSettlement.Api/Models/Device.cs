using System.ComponentModel.DataAnnotations;

namespace RehabSettlement.Api.Models;

public class Device
{
    [Key]
    public int Id { get; set; }

    [MaxLength(50)]
    public string DeviceCode { get; set; } = string.Empty;

    [MaxLength(200)]
    public string DeviceName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? DeviceType { get; set; }

    [MaxLength(100)]
    public string? Model { get; set; }

    [MaxLength(200)]
    public string? Manufacturer { get; set; }

    public DateOnly? PurchaseDate { get; set; }

    public int StatusId { get; set; } = 1;

    [MaxLength(200)]
    public string? Location { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public ICollection<DeviceUsageRecord> UsageRecords { get; set; } = new List<DeviceUsageRecord>();
}

public class DeviceUsageRecord
{
    [Key]
    public int Id { get; set; }

    public int DeviceId { get; set; }

    public int? BillId { get; set; }

    public int? TreatmentCalendarId { get; set; }

    public int? PatientId { get; set; }

    public DateOnly UseDate { get; set; }

    public TimeOnly? StartTime { get; set; }

    public TimeOnly? EndTime { get; set; }

    public int? Duration { get; set; }

    public int? OperatorId { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public Device? Device { get; set; }
    public SettlementBill? Bill { get; set; }
    public TreatmentCalendar? TreatmentCalendar { get; set; }
    public Patient? Patient { get; set; }
    public User? Operator { get; set; }
}
