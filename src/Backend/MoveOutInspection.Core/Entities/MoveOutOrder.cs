
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.Entities;

public class MoveOutOrder : EntityBase
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid ApartmentId { get; set; }
    public Apartment? Apartment { get; set; }
    public Guid TenantId { get; set; }
    public Tenant? Tenant { get; set; }
    public DateTime MoveOutDate { get; set; }
    public DateTime? ActualMoveOutDate { get; set; }
    public DateTime? InspectionDate { get; set; }
    public MoveOutStatus Status { get; set; }
    public Guid? AssignedHandlerId { get; set; }
    public Staff? AssignedHandler { get; set; }
    public Guid? CoHandlerId { get; set; }
    public Staff? CoHandler { get; set; }
    public string? Reason { get; set; }
    public decimal? TotalDeduction { get; set; }
    public decimal? FinalRefund { get; set; }
    public string? ReviewResult { get; set; }
    public DateTime? CompletedAt { get; set; }

    public ICollection<UtilityReading> UtilityReadings { get; set; } = new List<UtilityReading>();
    public ICollection<InspectionRecord> InspectionRecords { get; set; } = new List<InspectionRecord>();
    public ICollection<PaymentRecord> PaymentRecords { get; set; } = new List<PaymentRecord>();
    public ICollection<ComplaintTag> ComplaintTags { get; set; } = new List<ComplaintTag>();
    public ICollection<TimelineEvent> TimelineEvents { get; set; } = new List<TimelineEvent>();
    public ICollection<RentOverdueRecord> OverdueRecords { get; set; } = new List<RentOverdueRecord>();
    public ICollection<TodoTask> Todos { get; set; } = new List<TodoTask>();
    public ICollection<SourceRecord> SourceRecords { get; set; } = new List<SourceRecord>();
    public ICollection<RepairRecord> RepairRecords { get; set; } = new List<RepairRecord>();
}
