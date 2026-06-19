using System.ComponentModel.DataAnnotations;
using ScenicTicketBooking.Domain.Enums;

namespace ScenicTicketBooking.Shared.DTOs;

public class BookingRecordDto
{
    public Guid Id { get; set; }
    public string BookingNo { get; set; } = string.Empty;
    public Guid ScenicSpotId { get; set; }
    public string ScenicSpotName { get; set; } = string.Empty;
    public Guid TimeSlotId { get; set; }
    public DateOnly SlotDate { get; set; }
    public TimeSpan SlotStartTime { get; set; }
    public TimeSpan SlotEndTime { get; set; }
    public string SlotDisplay => $"{SlotDate:yyyy-MM-dd} {SlotStartTime:hh\\:mm}-{SlotEndTime:hh\\:mm}";
    public Guid TicketTypeId { get; set; }
    public string TicketTypeName { get; set; } = string.Empty;
    public Guid VisitorId { get; set; }
    public string VisitorName { get; set; } = string.Empty;
    public string IdCardNumber { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public BookingStatus Status { get; set; }
    public string StatusText => Status.ToString();
    public int Quantity { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Remarks { get; set; }
    public DateTime? ArrivalTime { get; set; }
    public string? ArrivalOperator { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public List<RescheduleRecordBriefDto>? RescheduleRecords { get; set; }
    public List<ConflictLogBriefDto>? Conflicts { get; set; }
    public bool HasConflict => Conflicts != null && Conflicts.Any(c => c.Status != ConflictStatus.Resolved && c.Status != ConflictStatus.Ignored);
}

public class RescheduleRecordBriefDto
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public string OriginalSlotDisplay { get; set; } = string.Empty;
    public string NewSlotDisplay { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public string? Operator { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ConflictLogBriefDto
{
    public Guid Id { get; set; }
    public ConflictType ConflictType { get; set; }
    public string ConflictTypeText => ConflictType.ToString();
    public ConflictStatus Status { get; set; }
    public string StatusText => Status.ToString();
    public string Reason { get; set; } = string.Empty;
    public string? ResponsiblePerson { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateBookingDto
{
    [Required]
    public Guid ScenicSpotId { get; set; }

    [Required]
    public Guid TimeSlotId { get; set; }

    [Required]
    public Guid TicketTypeId { get; set; }

    public Guid? VisitorId { get; set; }

    [MaxLength(100)]
    public string? VisitorName { get; set; }

    [MaxLength(18)]
    public string? VisitorIdCard { get; set; }

    [MaxLength(11)]
    public string? VisitorPhone { get; set; }

    public int Quantity { get; set; } = 1;

    [MaxLength(500)]
    public string? Remarks { get; set; }

    [MaxLength(100)]
    public string? CreatedBy { get; set; }
}

public class UpdateBookingDto
{
    public int Quantity { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public BookingStatus? Status { get; set; }

    [MaxLength(100)]
    public string? UpdatedBy { get; set; }
}

public class RescheduleBookingDto
{
    public Guid? NewTimeSlotId { get; set; }

    public Guid? NewScenicSpotId { get; set; }

    public DateOnly? NewSlotDate { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }

    [Required]
    [MaxLength(100)]
    public string OperatorName { get; set; } = string.Empty;
}

public class MarkArrivalDto
{
    [Required]
    [MaxLength(100)]
    public string OperatorName { get; set; } = string.Empty;

    public DateTime? ArrivalTime { get; set; }
}

public class BookingQueryDto
{
    public Guid? ScenicSpotId { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public BookingStatus? Status { get; set; }
    public string? SearchKeyword { get; set; }
    public bool? HasConflict { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)Math.Max(PageSize, 1));
}
