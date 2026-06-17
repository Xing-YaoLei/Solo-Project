
using MoveOutInspection.Core.Enums;

namespace MoveOutInspection.Core.DTOs.MoveOutOrder;

public class MoveOutOrderListDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string ApartmentNumber { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string TenantName { get; set; } = string.Empty;
    public string TenantPhone { get; set; } = string.Empty;
    public DateTime MoveOutDate { get; set; }
    public DateTime? ActualMoveOutDate { get; set; }
    public MoveOutStatus Status { get; set; }
    public string? AssignedHandlerName { get; set; }
    public DateTime CreatedAt { get; set; }
    public decimal? TotalDeduction { get; set; }
    public decimal? FinalRefund { get; set; }
    public bool HasOverdueRent { get; set; }
    public int PendingTodos { get; set; }
}

public class MoveOutOrderDetailDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid ApartmentId { get; set; }
    public string ApartmentNumber { get; set; } = string.Empty;
    public string Building { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
    public string TenantName { get; set; } = string.Empty;
    public string TenantPhone { get; set; } = string.Empty;
    public string? TenantEmail { get; set; }
    public DateTime? LeaseStartDate { get; set; }
    public DateTime? LeaseEndDate { get; set; }
    public decimal MonthlyRent { get; set; }
    public decimal Deposit { get; set; }
    public DateTime MoveOutDate { get; set; }
    public DateTime? ActualMoveOutDate { get; set; }
    public DateTime? InspectionDate { get; set; }
    public MoveOutStatus Status { get; set; }
    public Guid? AssignedHandlerId { get; set; }
    public string? AssignedHandlerName { get; set; }
    public string? AssignedHandlerPhone { get; set; }
    public Guid? CoHandlerId { get; set; }
    public string? CoHandlerName { get; set; }
    public string? Reason { get; set; }
    public decimal? TotalDeduction { get; set; }
    public decimal? FinalRefund { get; set; }
    public string? ReviewResult { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;

    public List<SourceRecordDto> SourceRecords { get; set; } = new();
}

public class SourceRecordDto
{
    public Guid Id { get; set; }
    public string SourceType { get; set; } = string.Empty;
    public string SourceId { get; set; } = string.Empty;
    public string SourceName { get; set; } = string.Empty;
    public string? OriginalData { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMoveOutOrderDto
{
    public Guid ApartmentId { get; set; }
    public Guid TenantId { get; set; }
    public DateTime MoveOutDate { get; set; }
    public Guid? AssignedHandlerId { get; set; }
    public Guid? CoHandlerId { get; set; }
    public string? Reason { get; set; }
    public List<CreateSourceRecordDto> SourceRecords { get; set; } = new();
}

public class CreateSourceRecordDto
{
    public string SourceType { get; set; } = string.Empty;
    public string SourceId { get; set; } = string.Empty;
    public string SourceName { get; set; } = string.Empty;
    public string? OriginalData { get; set; }
    public string? Remarks { get; set; }
}

public class UpdateMoveOutOrderDto
{
    public DateTime? MoveOutDate { get; set; }
    public DateTime? ActualMoveOutDate { get; set; }
    public DateTime? InspectionDate { get; set; }
    public MoveOutStatus? Status { get; set; }
    public Guid? AssignedHandlerId { get; set; }
    public Guid? CoHandlerId { get; set; }
    public string? Reason { get; set; }
    public string? ReviewResult { get; set; }
}

public class MoveOutOrderQueryDto : PagedQuery
{
    public MoveOutStatus? Status { get; set; }
    public Guid? AssignedHandlerId { get; set; }
    public DateTime? MoveOutDateFrom { get; set; }
    public DateTime? MoveOutDateTo { get; set; }
    public string? Building { get; set; }
    public bool? HasOverdueRent { get; set; }
}
