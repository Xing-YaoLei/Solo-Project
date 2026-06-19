using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using ScenicTicketBooking.Domain.Entities;
using ScenicTicketBooking.Domain.Interfaces;
using ScenicTicketBooking.Infrastructure.Data;

namespace ScenicTicketBooking.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private IDbContextTransaction? _transaction;

    public IRepository<ScenicSpot> ScenicSpots { get; }
    public IRepository<TimeSlot> TimeSlots { get; }
    public IRepository<TicketType> TicketTypes { get; }
    public IRepository<Visitor> Visitors { get; }
    public IRepository<TicketBooking> TicketBookings { get; }
    public IRepository<RescheduleRecord> RescheduleRecords { get; }
    public IRepository<ConflictLog> ConflictLogs { get; }
    public IRepository<Notification> Notifications { get; }
    public IRepository<ReminderList> ReminderLists { get; }
    public IRepository<ReminderListItem> ReminderListItems { get; }
    public IRepository<ReminderListChangeLog> ReminderListChangeLogs { get; }

    public UnitOfWork(AppDbContext context)
    {
        _context = context;

        ScenicSpots = new Repository<ScenicSpot>(context);
        TimeSlots = new Repository<TimeSlot>(context);
        TicketTypes = new Repository<TicketType>(context);
        Visitors = new Repository<Visitor>(context);
        TicketBookings = new Repository<TicketBooking>(context);
        RescheduleRecords = new Repository<RescheduleRecord>(context);
        ConflictLogs = new Repository<ConflictLog>(context);
        Notifications = new Repository<Notification>(context);
        ReminderLists = new Repository<ReminderList>(context);
        ReminderListItems = new Repository<ReminderListItem>(context);
        ReminderListChangeLogs = new Repository<ReminderListChangeLog>(context);
    }

    public IQueryable<T> Query<T>() where T : class => _context.Set<T>().AsNoTracking();

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        if (_transaction != null)
        {
            _transaction.Dispose();
        }
        _context.Dispose();
        GC.SuppressFinalize(this);
    }
}
