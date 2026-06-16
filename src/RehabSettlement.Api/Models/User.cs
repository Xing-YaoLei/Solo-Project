using System.ComponentModel.DataAnnotations;

namespace RehabSettlement.Api.Models;

public class User
{
    [Key]
    public int Id { get; set; }

    [MaxLength(50)]
    public string UserName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string RealName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(50)]
    public string Role { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Department { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public ICollection<SettlementBill> CreatedBills { get; set; } = new List<SettlementBill>();
    public ICollection<SettlementBill> AssignedBills { get; set; } = new List<SettlementBill>();
    public ICollection<TreatmentCalendar> DoctorTreatments { get; set; } = new List<TreatmentCalendar>();
    public ICollection<TreatmentCalendar> TherapistTreatments { get; set; } = new List<TreatmentCalendar>();
    public ICollection<NursingLog> NursingLogs { get; set; } = new List<NursingLog>();
}

public class SettlementItem
{
    [Key]
    public int Id { get; set; }

    public int BillId { get; set; }

    [MaxLength(50)]
    public string? ItemCode { get; set; }

    [MaxLength(200)]
    public string ItemName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? ItemType { get; set; }

    public decimal Quantity { get; set; } = 1;

    public decimal UnitPrice { get; set; }

    public decimal TotalPrice { get; set; }

    public decimal? InsuranceCoverage { get; set; }

    public decimal InsuranceAmount { get; set; }

    public decimal SelfPayAmount { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }

    public int SortOrder { get; set; }

    public SettlementBill? Bill { get; set; }
}

public class StatusTransition
{
    [Key]
    public int Id { get; set; }

    public int BillId { get; set; }

    public int? FromStatusId { get; set; }

    public int ToStatusId { get; set; }

    public int? OperatorId { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public SettlementBill? Bill { get; set; }
    public User? Operator { get; set; }
}

public class ExceptionRecord
{
    [Key]
    public int Id { get; set; }

    public int BillId { get; set; }

    [MaxLength(50)]
    public string ExceptionType { get; set; } = string.Empty;

    public int? RejectionReasonId { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    public int? HandlerId { get; set; }

    [MaxLength(50)]
    public string? HandleMethod { get; set; }

    [MaxLength(1000)]
    public string? HandleRemark { get; set; }

    public DateTime? HandledAt { get; set; }

    public DateTime? EscalatedAt { get; set; }

    public int? EscalatedTo { get; set; }

    public bool IsClosed { get; set; }

    public DateTime? ClosedAt { get; set; }

    public int? ClosedById { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public SettlementBill? Bill { get; set; }
    public RejectionReason? RejectionReason { get; set; }
    public User? Handler { get; set; }
    public User? EscalatedToUser { get; set; }
    public User? ClosedBy { get; set; }
    public ICollection<SupplementMaterial> SupplementMaterials { get; set; } = new List<SupplementMaterial>();
}

public class SupplementMaterial
{
    [Key]
    public int Id { get; set; }

    public int ExceptionRecordId { get; set; }

    public int BillId { get; set; }

    [MaxLength(200)]
    public string MaterialName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? MaterialType { get; set; }

    [MaxLength(500)]
    public string? FileUrl { get; set; }

    public int? UploadedById { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ExceptionRecord? ExceptionRecord { get; set; }
    public SettlementBill? Bill { get; set; }
    public User? UploadedBy { get; set; }
}

public class BillReviewTag
{
    [Key]
    public int Id { get; set; }

    public int BillId { get; set; }

    public int ReviewTagId { get; set; }

    public int? TaggedById { get; set; }

    public DateTime TaggedAt { get; set; } = DateTime.Now;

    public SettlementBill? Bill { get; set; }
    public ReviewTag? ReviewTag { get; set; }
    public User? TaggedBy { get; set; }
}

public class Attachment
{
    [Key]
    public int Id { get; set; }

    public int? BillId { get; set; }

    public int? TreatmentCalendarId { get; set; }

    public int? NursingLogId { get; set; }

    [MaxLength(200)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string FileUrl { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? FileType { get; set; }

    public long? FileSize { get; set; }

    public int? UploadedById { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public SettlementBill? Bill { get; set; }
    public TreatmentCalendar? TreatmentCalendar { get; set; }
    public NursingLog? NursingLog { get; set; }
    public User? UploadedBy { get; set; }
}

public class AuditLog
{
    [Key]
    public long Id { get; set; }

    public int? UserId { get; set; }

    [MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? EntityType { get; set; }

    public int? EntityId { get; set; }

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    [MaxLength(50)]
    public string? IpAddress { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
