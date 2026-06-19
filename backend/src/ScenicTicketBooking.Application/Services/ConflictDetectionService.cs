using Microsoft.EntityFrameworkCore;
using ScenicTicketBooking.Domain.Entities;
using ScenicTicketBooking.Domain.Enums;
using ScenicTicketBooking.Domain.Interfaces;
using ScenicTicketBooking.Shared.DTOs;

namespace ScenicTicketBooking.Application.Services;

public interface IConflictDetectionService
{
    Task<ConflictDetectionResult> DetectAndLogConflictsAsync(TicketBooking booking, CancellationToken cancellationToken = default);
    Task<ConflictDetectionResult> CheckConflictsForBookingAsync(Guid scenicSpotId, Guid timeSlotId, Guid visitorId, int quantity, CancellationToken cancellationToken = default);
    Task<IEnumerable<ConflictLogDto>> GetActiveConflictsAsync(Guid? scenicSpotId = null, CancellationToken cancellationToken = default);
    Task<ConflictLogDto?> GetConflictByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ConflictLogDto> ProcessConflictAsync(Guid id, ProcessConflictDto dto, CancellationToken cancellationToken = default);
    Task RunScheduledConflictDetectionAsync(CancellationToken cancellationToken = default);
}

public class ConflictDetectionService : IConflictDetectionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly INotificationService _notificationService;

    public ConflictDetectionService(IUnitOfWork unitOfWork, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _notificationService = notificationService;
    }

    public async Task<ConflictDetectionResult> DetectAndLogConflictsAsync(TicketBooking booking, CancellationToken cancellationToken = default)
    {
        var result = new ConflictDetectionResult();
        var conflicts = new List<ConflictLog>();

        var timeSlot = await _unitOfWork.TimeSlots.GetByIdAsync(booking.TimeSlotId, cancellationToken);
        if (timeSlot == null) return result;

        var visitor = await _unitOfWork.Visitors.GetByIdAsync(booking.VisitorId, cancellationToken);

        if (visitor != null && visitor.IsBlacklisted)
        {
            var conflict = new ConflictLog
            {
                Id = Guid.NewGuid(),
                ConflictType = ConflictType.BlacklistVisitor,
                Status = ConflictStatus.Detected,
                BookingId = booking.Id,
                TimeSlotId = booking.TimeSlotId,
                Reason = $"访客 {visitor.Name} (身份证: {visitor.IdCardNumber}) 在黑名单中，原因: {visitor.BlacklistReason ?? "未说明"}",
                CreatedAt = DateTime.UtcNow
            };
            conflicts.Add(conflict);
        }

        var overlapBookings = await (_unitOfWork.TicketBookings as IQueryable<TicketBooking>)!
            .Include(b => b.Visitor)
            .Include(b => b.TimeSlot)
            .Where(b => b.Id != booking.Id
                && b.VisitorId == booking.VisitorId
                && b.TimeSlot.Date == timeSlot.Date
                && b.Status != BookingStatus.Cancelled
                && ((b.TimeSlot.StartTime < timeSlot.EndTime && b.TimeSlot.EndTime > timeSlot.StartTime)))
            .ToListAsync(cancellationToken);

        foreach (var overlap in overlapBookings)
        {
            var conflict = new ConflictLog
            {
                Id = Guid.NewGuid(),
                ConflictType = ConflictType.TimeSlotOverlap,
                Status = ConflictStatus.Detected,
                BookingId = booking.Id,
                RelatedBookingId = overlap.Id,
                TimeSlotId = booking.TimeSlotId,
                Reason = $"时段重叠冲突：预约 [{booking.BookingNo}] 与预约 [{overlap.BookingNo}] " +
                         $"在 {timeSlot.Date:yyyy-MM-dd} 的时段重叠。" +
                         $"本预约时段: {timeSlot.StartTime:hh\\:mm}-{timeSlot.EndTime:hh\\:mm}，" +
                         $"冲突预约时段: {overlap.TimeSlot.StartTime:hh\\:mm}-{overlap.TimeSlot.EndTime:hh\\:mm}",
                CreatedAt = DateTime.UtcNow
            };
            conflicts.Add(conflict);
        }

        var dayStart = timeSlot.Date.ToDateTime(TimeOnly.MinValue);
        var dayEnd = timeSlot.Date.ToDateTime(TimeOnly.MaxValue);

        var dayBookings = await (_unitOfWork.TicketBookings as IQueryable<TicketBooking>)!
            .Where(b => b.Id != booking.Id
                && b.VisitorId == booking.VisitorId
                && b.TimeSlot.Date == timeSlot.Date
                && b.Status != BookingStatus.Cancelled)
            .SumAsync(b => b.Quantity, cancellationToken);

        var scenicSpot = await _unitOfWork.ScenicSpots.GetByIdAsync(booking.ScenicSpotId, cancellationToken);
        if (scenicSpot != null && scenicSpot.MaxDailyCapacity > 0)
        {
            var totalDayQuantity = dayBookings + booking.Quantity;
            var dailyBookingsCount = await (_unitOfWork.TicketBookings as IQueryable<TicketBooking>)!
                .Where(b => b.ScenicSpotId == booking.ScenicSpotId
                    && b.TimeSlot.Date == timeSlot.Date
                    && b.Status != BookingStatus.Cancelled)
                .SumAsync(b => b.Quantity, cancellationToken);

            if (dailyBookingsCount > scenicSpot.MaxDailyCapacity)
            {
                var conflict = new ConflictLog
                {
                    Id = Guid.NewGuid(),
                    ConflictType = ConflictType.CapacityExceeded,
                    Status = ConflictStatus.Detected,
                    BookingId = booking.Id,
                    TimeSlotId = booking.TimeSlotId,
                    Reason = $"日容量超限：景区 [{scenicSpot.Name}] {timeSlot.Date:yyyy-MM-dd} 最大日容量 {scenicSpot.MaxDailyCapacity} 人，" +
                             $"当前预约 {dailyBookingsCount} 人，已超出容量 {dailyBookingsCount - scenicSpot.MaxDailyCapacity} 人",
                    CreatedAt = DateTime.UtcNow
                };
                conflicts.Add(conflict);
            }
        }

        foreach (var conflict in conflicts)
        {
            await _unitOfWork.ConflictLogs.AddAsync(conflict, cancellationToken);
            result.Conflicts.Add(new ConflictLogBriefDto
            {
                Id = conflict.Id,
                ConflictType = conflict.ConflictType,
                Status = conflict.Status,
                Reason = conflict.Reason,
                CreatedAt = conflict.CreatedAt
            });
        }

        if (conflicts.Any())
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            result.HasConflict = true;
            result.Summary = $"检测到 {conflicts.Count} 个冲突";

            foreach (var conflict in conflicts)
            {
                await NotifyConflictToResponsiblePersonsAsync(conflict, scenicSpot, cancellationToken);
            }
        }

        return result;
    }

    public async Task<ConflictDetectionResult> CheckConflictsForBookingAsync(
        Guid scenicSpotId, Guid timeSlotId, Guid visitorId, int quantity,
        CancellationToken cancellationToken = default)
    {
        var result = new ConflictDetectionResult();

        var timeSlot = await _unitOfWork.TimeSlots.GetByIdAsync(timeSlotId, cancellationToken);
        var visitor = await _unitOfWork.Visitors.GetByIdAsync(visitorId, cancellationToken);
        var scenicSpot = await _unitOfWork.ScenicSpots.GetByIdAsync(scenicSpotId, cancellationToken);

        if (visitor != null && visitor.IsBlacklisted)
        {
            result.Conflicts.Add(new ConflictLogBriefDto
            {
                ConflictType = ConflictType.BlacklistVisitor,
                Status = ConflictStatus.Detected,
                Reason = $"访客 {visitor.Name} 在黑名单中，原因: {visitor.BlacklistReason ?? "未说明"}"
            });
        }

        if (timeSlot != null)
        {
            var overlapBookings = await (_unitOfWork.TicketBookings as IQueryable<TicketBooking>)!
                .Include(b => b.TimeSlot)
                .Where(b => b.VisitorId == visitorId
                    && b.TimeSlot.Date == timeSlot.Date
                    && b.Status != BookingStatus.Cancelled
                    && ((b.TimeSlot.StartTime < timeSlot.EndTime && b.TimeSlot.EndTime > timeSlot.StartTime)))
                .ToListAsync(cancellationToken);

            foreach (var overlap in overlapBookings)
            {
                result.Conflicts.Add(new ConflictLogBriefDto
                {
                    ConflictType = ConflictType.TimeSlotOverlap,
                    Status = ConflictStatus.Detected,
                    Reason = $"时段重叠：与预约 [{overlap.BookingNo}] 时段 {overlap.TimeSlot.StartTime:hh\\:mm}-{overlap.TimeSlot.EndTime:hh\\:mm} 重叠"
                });
            }
        }

        result.HasConflict = result.Conflicts.Any();
        result.Summary = result.HasConflict ? $"检测到 {result.Conflicts.Count} 个潜在冲突" : "未检测到冲突";
        return result;
    }

    public async Task<IEnumerable<ConflictLogDto>> GetActiveConflictsAsync(Guid? scenicSpotId = null, CancellationToken cancellationToken = default)
    {
        var queryable = (_unitOfWork.ConflictLogs as IQueryable<ConflictLog>)!
            .Include(c => c.Booking)
            .Include(c => c.RelatedBooking)
            .Include(c => c.TimeSlot)
            .Include(c => c.Notifications)
            .Where(c => c.Status != ConflictStatus.Resolved && c.Status != ConflictStatus.Ignored);

        if (scenicSpotId.HasValue)
            queryable = queryable.Where(c => c.Booking != null && c.Booking.ScenicSpotId == scenicSpotId.Value);

        queryable = queryable.OrderByDescending(c => c.CreatedAt);

        return await queryable.Select(c => MapToConflictLogDto(c)).ToListAsync(cancellationToken);
    }

    public async Task<ConflictLogDto?> GetConflictByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var conflict = await (_unitOfWork.ConflictLogs as IQueryable<ConflictLog>)!
            .Include(c => c.Booking)
            .Include(c => c.RelatedBooking)
            .Include(c => c.TimeSlot)
            .Include(c => c.Notifications)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        return conflict != null ? MapToConflictLogDto(conflict) : null;
    }

    public async Task<ConflictLogDto> ProcessConflictAsync(Guid id, ProcessConflictDto dto, CancellationToken cancellationToken = default)
    {
        var conflict = await _unitOfWork.ConflictLogs.GetByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException($"冲突记录不存在: {id}");

        conflict.Status = dto.Status;
        conflict.ResolveAction = dto.ResolveAction;
        conflict.ProcessedBy = dto.ProcessedBy;
        conflict.ProcessedAt = DateTime.UtcNow;

        if (dto.Status == ConflictStatus.Resolved || dto.Status == ConflictStatus.Ignored)
        {
            conflict.ClosedAt = DateTime.UtcNow;
        }

        _unitOfWork.ConflictLogs.Update(conflict);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return await GetConflictByIdAsync(id, cancellationToken)
            ?? throw new InvalidOperationException("处理冲突后读取失败");
    }

    public async Task RunScheduledConflictDetectionAsync(CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var bookingsToCheck = await (_unitOfWork.TicketBookings as IQueryable<TicketBooking>)!
            .Include(b => b.TimeSlot)
            .Include(b => b.Visitor)
            .Where(b => (b.Status == BookingStatus.Confirmed || b.Status == BookingStatus.Rescheduled)
                && b.TimeSlot.Date >= today
                && b.TimeSlot.Date <= today.AddDays(7))
            .ToListAsync(cancellationToken);

        foreach (var booking in bookingsToCheck)
        {
            var existingConflicts = await _unitOfWork.ConflictLogs.FindAsync(
                c => c.BookingId == booking.Id && c.Status != ConflictStatus.Resolved && c.Status != ConflictStatus.Ignored,
                cancellationToken);

            if (!existingConflicts.Any())
            {
                await DetectAndLogConflictsAsync(booking, cancellationToken);
            }
        }
    }

    private async Task NotifyConflictToResponsiblePersonsAsync(ConflictLog conflict, ScenicSpot? scenicSpot, CancellationToken cancellationToken)
    {
        var reminderLists = await (_unitOfWork.ReminderLists as IQueryable<ReminderList>)!
            .Include(r => r.Items)
            .Where(r => r.IsActive
                && (!r.ScenicSpotId.HasValue || (scenicSpot != null && r.ScenicSpotId == scenicSpot.Id)))
            .ToListAsync(cancellationToken);

        var responsiblePersons = new List<string>();

        foreach (var list in reminderLists)
        {
            foreach (var item in list.Items.Where(i => i.IsActive && i.ReceiveConflictNotifications))
            {
                var title = $"【冲突预警】{conflict.ConflictType}";
                var content = $@"
景区运营冲突预警通知
-----------------------------------
冲突类型: {conflict.ConflictType}
冲突原因: {conflict.Reason}
创建时间: {conflict.CreatedAt:yyyy-MM-dd HH:mm:ss}

请相关负责人及时登录系统处理此冲突。
";
                if (!string.IsNullOrEmpty(item.PhoneNumber))
                {
                    await _notificationService.CreateNotificationAsync(Domain.Enums.NotificationChannel.SMS,
                        title, content, item.PersonName, conflict.Id, cancellationToken);
                    responsiblePersons.Add(item.PersonName);
                }
                if (!string.IsNullOrEmpty(item.Email))
                {
                    await _notificationService.CreateNotificationAsync(Domain.Enums.NotificationChannel.Email,
                        title, content, item.Email, conflict.Id, cancellationToken);
                }
                await _notificationService.CreateNotificationAsync(Domain.Enums.NotificationChannel.System,
                    title, content, item.PersonName, conflict.Id, cancellationToken);
            }
        }

        if (responsiblePersons.Any())
        {
            conflict.ResponsiblePerson = string.Join(", ", responsiblePersons.Distinct());
            conflict.Status = ConflictStatus.Notified;
            conflict.NotifiedAt = DateTime.UtcNow;
            _unitOfWork.ConflictLogs.Update(conflict);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }

    private static ConflictLogDto MapToConflictLogDto(ConflictLog c)
    {
        return new ConflictLogDto
        {
            Id = c.Id,
            ConflictType = c.ConflictType,
            Status = c.Status,
            BookingId = c.BookingId,
            BookingNo = c.Booking?.BookingNo,
            RelatedBookingId = c.RelatedBookingId,
            RelatedBookingNo = c.RelatedBooking?.BookingNo,
            TimeSlotId = c.TimeSlotId,
            TimeSlotDisplay = c.TimeSlot != null
                ? $"{c.TimeSlot.Date:yyyy-MM-dd} {c.TimeSlot.StartTime:hh\\:mm}-{c.TimeSlot.EndTime:hh\\:mm}"
                : null,
            Reason = c.Reason,
            ResolveAction = c.ResolveAction,
            ResponsiblePerson = c.ResponsiblePerson,
            ProcessedBy = c.ProcessedBy,
            NotifiedAt = c.NotifiedAt,
            ProcessedAt = c.ProcessedAt,
            ClosedAt = c.ClosedAt,
            CreatedAt = c.CreatedAt,
            CreatedBy = c.CreatedBy,
            Notifications = c.Notifications?.Select(n => new NotificationDto
            {
                Id = n.Id,
                Channel = n.Channel,
                Title = n.Title,
                Content = n.Content,
                Recipient = n.Recipient,
                ConflictLogId = n.ConflictLogId,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt,
                IsSent = n.IsSent,
                SentAt = n.SentAt,
                RetryCount = n.RetryCount,
                CreatedAt = n.CreatedAt
            }).ToList()
        };
    }
}
