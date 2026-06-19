using ScenicTicketBooking.Domain.Entities;

namespace ScenicTicketBooking.Domain.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<ScenicSpot> ScenicSpots { get; }
    IRepository<TimeSlot> TimeSlots { get; }
    IRepository<TicketType> TicketTypes { get; }
    IRepository<Visitor> Visitors { get; }
    IRepository<TicketBooking> TicketBookings { get; }
    IRepository<RescheduleRecord> RescheduleRecords { get; }
    IRepository<ConflictLog> ConflictLogs { get; }
    IRepository<Notification> Notifications { get; }
    IRepository<ReminderList> ReminderLists { get; }
    IRepository<ReminderListItem> ReminderListItems { get; }
    IRepository<ReminderListChangeLog> ReminderListChangeLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
