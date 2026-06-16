using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RehabSettlement.Api.Models;

public class SettlementBill
{
    [Key]
    public int Id { get; set; }

    [MaxLength(50)]
    public string BillNo { get; set; } = string.Empty;

    public int PatientId { get; set; }

    public int StatusId { get; set; }

    public int? SourceChannelId { get; set; }

    public int? AssigneeId { get; set; }

    public DateOnly? TreatmentStartDate { get; set; }

    public DateOnly? TreatmentEndDate { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal InsuranceAmount { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal SelfPayAmount { get; set; }

    public int? RejectionReasonId { get; set; }

    [MaxLength(500)]
    public string? RejectionRemark { get; set; }

    [MaxLength(1000)]
    public string? Remark { get; set; }

    public int? CreatedById { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public DateTime? SubmittedAt { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public int? ReviewedById { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public int? ProcessedById { get; set; }

    public DateTime? ReviewedFinalAt { get; set; }

    public int? ReviewedFinalById { get; set; }

    public DateTime? ClosedAt { get; set; }

    public int? ClosedById { get; set; }

    public Patient? Patient { get; set; }
    public SourceChannel? SourceChannel { get; set; }
    public User? Assignee { get; set; }
    public User? CreatedBy { get; set; }
    public User? ReviewedBy { get; set; }
    public User? ProcessedBy { get; set; }
    public User? ReviewedFinalBy { get; set; }
    public User? ClosedBy { get; set; }
    public RejectionReason? RejectionReason { get; set; }

    public ICollection<SettlementItem> Items { get; set; } = new List<SettlementItem>();
    public ICollection<TreatmentCalendar> TreatmentCalendars { get; set; } = new List<TreatmentCalendar>();
    public ICollection<NursingLog> NursingLogs { get; set; } = new List<NursingLog>();
    public ICollection<StatusTransition> StatusTransitions { get; set; } = new List<StatusTransition>();
    public ICollection<ExceptionRecord> ExceptionRecords { get; set; } = new List<ExceptionRecord>();
    public ICollection<BillReviewTag> ReviewTags { get; set; } = new List<BillReviewTag>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
    public ICollection<DeviceUsageRecord> DeviceUsageRecords { get; set; } = new List<DeviceUsageRecord>();
}
