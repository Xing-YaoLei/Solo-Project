using Microsoft.EntityFrameworkCore;
using ScenicTicketBooking.Domain.Entities;
using ScenicTicketBooking.Domain.Enums;
using ScenicTicketBooking.Domain.Interfaces;
using ScenicTicketBooking.Shared.DTOs;

namespace ScenicTicketBooking.Application.Services;

public interface IBookingService
{
    Task<PagedResult<BookingRecordDto>> GetPagedBookingsAsync(BookingQueryDto query, CancellationToken cancellationToken = default);
    Task<BookingRecordDto?> GetBookingByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BookingRecordDto> CreateBookingAsync(CreateBookingDto dto, CancellationToken cancellationToken = default);
    Task<BookingRecordDto> UpdateBookingAsync(Guid id, UpdateBookingDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteBookingAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BookingRecordDto> RescheduleBookingAsync(Guid id, RescheduleBookingDto dto, CancellationToken cancellationToken = default);
    Task<BookingRecordDto> MarkArrivalAsync(Guid id, MarkArrivalDto dto, CancellationToken cancellationToken = default);
    Task<BookingRecordDto> CancelBookingAsync(Guid id, string reason, string operatorName, CancellationToken cancellationToken = default);
}

public class BookingService : IBookingService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConflictDetectionService _conflictDetection;

    public BookingService(IUnitOfWork unitOfWork, IConflictDetectionService conflictDetection)
    {
        _unitOfWork = unitOfWork;
        _conflictDetection = conflictDetection;
    }

    public async Task<PagedResult<BookingRecordDto>> GetPagedBookingsAsync(BookingQueryDto query, CancellationToken cancellationToken = default)
    {
        var queryable = _unitOfWork.TicketBookings as IQueryable<TicketBooking>;

        if (queryable is null)
            return new PagedResult<BookingRecordDto>();

        queryable = queryable
            .Include(b => b.ScenicSpot)
            .Include(b => b.TimeSlot)
            .Include(b => b.TicketType)
            .Include(b => b.Visitor)
            .Include(b => b.RescheduleRecords)
                .ThenInclude(r => r.OriginalTimeSlot)
            .Include(b => b.RescheduleRecords)
                .ThenInclude(r => r.NewTimeSlot)
            .Include(b => b.ConflictLogs);

        if (query.ScenicSpotId.HasValue)
            queryable = queryable.Where(b => b.ScenicSpotId == query.ScenicSpotId.Value);

        if (query.StartDate.HasValue)
            queryable = queryable.Where(b => b.TimeSlot.Date >= query.StartDate.Value);

        if (query.EndDate.HasValue)
            queryable = queryable.Where(b => b.TimeSlot.Date <= query.EndDate.Value);

        if (query.Status.HasValue)
            queryable = queryable.Where(b => b.Status == query.Status.Value);

        if (!string.IsNullOrWhiteSpace(query.SearchKeyword))
        {
            queryable = queryable.Where(b =>
                b.BookingNo.Contains(query.SearchKeyword) ||
                b.Visitor.Name.Contains(query.SearchKeyword) ||
                b.Visitor.IdCardNumber.Contains(query.SearchKeyword) ||
                (b.Visitor.PhoneNumber != null && b.Visitor.PhoneNumber.Contains(query.SearchKeyword)));
        }

        if (query.HasConflict.HasValue)
        {
            if (query.HasConflict.Value)
                queryable = queryable.Where(b => b.ConflictLogs.Any(c => c.Status != ConflictStatus.Resolved && c.Status != ConflictStatus.Ignored));
            else
                queryable = queryable.Where(b => !b.ConflictLogs.Any(c => c.Status != ConflictStatus.Resolved && c.Status != ConflictStatus.Ignored));
        }

        queryable = queryable.OrderByDescending(b => b.CreatedAt);

        var totalCount = await queryable.CountAsync(cancellationToken);

        var items = await queryable
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(b => MapToBookingRecordDto(b))
            .ToListAsync(cancellationToken);

        return new PagedResult<BookingRecordDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<BookingRecordDto?> GetBookingByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var booking = await (_unitOfWork.TicketBookings as IQueryable<TicketBooking>)!
            .Include(b => b.ScenicSpot)
            .Include(b => b.TimeSlot)
            .Include(b => b.TicketType)
            .Include(b => b.Visitor)
            .Include(b => b.RescheduleRecords)
                .ThenInclude(r => r.OriginalTimeSlot)
            .Include(b => b.RescheduleRecords)
                .ThenInclude(r => r.NewTimeSlot)
            .Include(b => b.ConflictLogs)
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

        return booking != null ? MapToBookingRecordDto(booking) : null;
    }

    public async Task<BookingRecordDto> CreateBookingAsync(CreateBookingDto dto, CancellationToken cancellationToken = default)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var timeSlot = await _unitOfWork.TimeSlots.GetByIdAsync(dto.TimeSlotId, cancellationToken)
                ?? throw new InvalidOperationException($"时段不存在: {dto.TimeSlotId}");

            var ticketType = await _unitOfWork.TicketTypes.GetByIdAsync(dto.TicketTypeId, cancellationToken)
                ?? throw new InvalidOperationException($"票种不存在: {dto.TicketTypeId}");

            if (timeSlot.BookedCount + dto.Quantity > timeSlot.Capacity)
                throw new InvalidOperationException("该时段已超出容量限制");

            var booking = new TicketBooking
            {
                Id = Guid.NewGuid(),
                BookingNo = await GenerateBookingNoAsync(cancellationToken),
                ScenicSpotId = dto.ScenicSpotId,
                TimeSlotId = dto.TimeSlotId,
                TicketTypeId = dto.TicketTypeId,
                VisitorId = dto.VisitorId,
                Quantity = dto.Quantity,
                TotalAmount = ticketType.Price * dto.Quantity,
                Remarks = dto.Remarks,
                Status = BookingStatus.Pending,
                CreatedBy = dto.CreatedBy ?? "System",
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.TicketBookings.AddAsync(booking, cancellationToken);

            timeSlot.BookedCount += dto.Quantity;
            timeSlot.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.TimeSlots.Update(timeSlot);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _conflictDetection.DetectAndLogConflictsAsync(booking, cancellationToken);

            booking.Status = BookingStatus.Confirmed;
            booking.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.TicketBookings.Update(booking);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return await GetBookingByIdAsync(booking.Id, cancellationToken)
                ?? throw new InvalidOperationException("创建预约后读取失败");
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BookingRecordDto> UpdateBookingAsync(Guid id, UpdateBookingDto dto, CancellationToken cancellationToken = default)
    {
        var booking = await _unitOfWork.TicketBookings.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"预约不存在: {id}");

        booking.Quantity = dto.Quantity;
        booking.Remarks = dto.Remarks;
        if (dto.Status.HasValue)
            booking.Status = dto.Status.Value;
        booking.UpdatedBy = dto.UpdatedBy;
        booking.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.TicketBookings.Update(booking);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetBookingByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("更新预约后读取失败");
    }

    public async Task<bool> DeleteBookingAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var booking = await _unitOfWork.TicketBookings.GetByIdAsync(id, cancellationToken);
        if (booking == null) return false;

        var timeSlot = await _unitOfWork.TimeSlots.GetByIdAsync(booking.TimeSlotId, cancellationToken);
        if (timeSlot != null)
        {
            timeSlot.BookedCount = Math.Max(0, timeSlot.BookedCount - booking.Quantity);
            timeSlot.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.TimeSlots.Update(timeSlot);
        }

        _unitOfWork.TicketBookings.Delete(booking);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<BookingRecordDto> RescheduleBookingAsync(Guid id, RescheduleBookingDto dto, CancellationToken cancellationToken = default)
    {
        await _unitOfWork.BeginTransactionAsync(cancellationToken);
        try
        {
            var booking = await _unitOfWork.TicketBookings.GetByIdAsync(id, cancellationToken)
                ?? throw new InvalidOperationException($"预约不存在: {id}");

            var originalTimeSlot = await _unitOfWork.TimeSlots.GetByIdAsync(booking.TimeSlotId, cancellationToken)
                ?? throw new InvalidOperationException("原时段不存在");

            var newTimeSlot = await _unitOfWork.TimeSlots.GetByIdAsync(dto.NewTimeSlotId, cancellationToken)
                ?? throw new InvalidOperationException($"新时段不存在: {dto.NewTimeSlotId}");

            if (originalTimeSlot.Id == newTimeSlot.Id)
                throw new InvalidOperationException("新时段不能与原时段相同");

            if (newTimeSlot.BookedCount + booking.Quantity > newTimeSlot.Capacity)
                throw new InvalidOperationException("新时段已超出容量限制");

            var rescheduleRecord = new RescheduleRecord
            {
                Id = Guid.NewGuid(),
                BookingId = booking.Id,
                OriginalTimeSlotId = originalTimeSlot.Id,
                NewTimeSlotId = newTimeSlot.Id,
                Reason = dto.Reason,
                Operator = dto.Operator,
                CreatedAt = DateTime.UtcNow
            };
            await _unitOfWork.RescheduleRecords.AddAsync(rescheduleRecord, cancellationToken);

            originalTimeSlot.BookedCount = Math.Max(0, originalTimeSlot.BookedCount - booking.Quantity);
            originalTimeSlot.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.TimeSlots.Update(originalTimeSlot);

            newTimeSlot.BookedCount += booking.Quantity;
            newTimeSlot.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.TimeSlots.Update(newTimeSlot);

            booking.TimeSlotId = newTimeSlot.Id;
            booking.Status = BookingStatus.Rescheduled;
            booking.UpdatedBy = dto.Operator;
            booking.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.TicketBookings.Update(booking);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _conflictDetection.DetectAndLogConflictsAsync(booking, cancellationToken);

            booking.Status = BookingStatus.Confirmed;
            booking.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.TicketBookings.Update(booking);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            await _unitOfWork.CommitTransactionAsync(cancellationToken);

            return await GetBookingByIdAsync(id, cancellationToken)
                ?? throw new InvalidOperationException("改约后读取失败");
        }
        catch
        {
            await _unitOfWork.RollbackTransactionAsync(cancellationToken);
            throw;
        }
    }

    public async Task<BookingRecordDto> MarkArrivalAsync(Guid id, MarkArrivalDto dto, CancellationToken cancellationToken = default)
    {
        var booking = await _unitOfWork.TicketBookings.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"预约不存在: {id}");

        if (booking.Status != BookingStatus.Confirmed && booking.Status != BookingStatus.Rescheduled)
            throw new InvalidOperationException($"当前状态不允许标记到场: {booking.Status}");

        booking.Status = BookingStatus.Arrived;
        booking.ArrivalTime = dto.ArrivalTime ?? DateTime.UtcNow;
        booking.ArrivalOperator = dto.Operator;
        booking.UpdatedBy = dto.Operator;
        booking.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.TicketBookings.Update(booking);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetBookingByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("标记到场后读取失败");
    }

    public async Task<BookingRecordDto> CancelBookingAsync(Guid id, string reason, string operatorName, CancellationToken cancellationToken = default)
    {
        var booking = await _unitOfWork.TicketBookings.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"预约不存在: {id}");

        var timeSlot = await _unitOfWork.TimeSlots.GetByIdAsync(booking.TimeSlotId, cancellationToken);
        if (timeSlot != null)
        {
            timeSlot.BookedCount = Math.Max(0, timeSlot.BookedCount - booking.Quantity);
            timeSlot.UpdatedAt = DateTime.UtcNow;
            _unitOfWork.TimeSlots.Update(timeSlot);
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancelledAt = DateTime.UtcNow;
        booking.CancellationReason = reason;
        booking.UpdatedBy = operatorName;
        booking.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.TicketBookings.Update(booking);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetBookingByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("取消预约后读取失败");
    }

    private async Task<string> GenerateBookingNoAsync(CancellationToken cancellationToken)
    {
        var today = DateTime.Now;
        var prefix = $"BK{today:yyyyMMdd}";
        var count = await _unitOfWork.TicketBookings.CountAsync(
            b => b.BookingNo.StartsWith(prefix), cancellationToken);
        return $"{prefix}{(count + 1):D6}";
    }

    private static BookingRecordDto MapToBookingRecordDto(TicketBooking b)
    {
        return new BookingRecordDto
        {
            Id = b.Id,
            BookingNo = b.BookingNo,
            ScenicSpotId = b.ScenicSpotId,
            ScenicSpotName = b.ScenicSpot?.Name ?? string.Empty,
            TimeSlotId = b.TimeSlotId,
            SlotDate = b.TimeSlot?.Date ?? default,
            SlotStartTime = b.TimeSlot?.StartTime ?? default,
            SlotEndTime = b.TimeSlot?.EndTime ?? default,
            TicketTypeId = b.TicketTypeId,
            TicketTypeName = b.TicketType?.Name ?? string.Empty,
            VisitorId = b.VisitorId,
            VisitorName = b.Visitor?.Name ?? string.Empty,
            IdCardNumber = b.Visitor?.IdCardNumber ?? string.Empty,
            PhoneNumber = b.Visitor?.PhoneNumber,
            Status = b.Status,
            Quantity = b.Quantity,
            TotalAmount = b.TotalAmount,
            Remarks = b.Remarks,
            ArrivalTime = b.ArrivalTime,
            ArrivalOperator = b.ArrivalOperator,
            CreatedAt = b.CreatedAt,
            CreatedBy = b.CreatedBy,
            RescheduleRecords = b.RescheduleRecords?.Select(r => new RescheduleRecordBriefDto
            {
                Id = r.Id,
                BookingId = r.BookingId,
                OriginalSlotDisplay = r.OriginalTimeSlot != null
                    ? $"{r.OriginalTimeSlot.Date:yyyy-MM-dd} {r.OriginalTimeSlot.StartTime:hh\\:mm}-{r.OriginalTimeSlot.EndTime:hh\\:mm}"
                    : string.Empty,
                NewSlotDisplay = r.NewTimeSlot != null
                    ? $"{r.NewTimeSlot.Date:yyyy-MM-dd} {r.NewTimeSlot.StartTime:hh\\:mm}-{r.NewTimeSlot.EndTime:hh\\:mm}"
                    : string.Empty,
                Reason = r.Reason,
                Operator = r.Operator,
                CreatedAt = r.CreatedAt
            }).ToList(),
            Conflicts = b.ConflictLogs?.Select(c => new ConflictLogBriefDto
            {
                Id = c.Id,
                ConflictType = c.ConflictType,
                Status = c.Status,
                Reason = c.Reason,
                ResponsiblePerson = c.ResponsiblePerson,
                CreatedAt = c.CreatedAt
            }).ToList()
        };
    }
}
