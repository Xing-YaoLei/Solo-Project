using HearingCalendar.Domain.Common;
using HearingCalendar.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HearingCalendar.Infrastructure.Data;

public class HearingCalendarDbContext : DbContext
{
    public HearingCalendarDbContext(DbContextOptions<HearingCalendarDbContext> options) : base(options) { }

    public DbSet<HearingSchedule> HearingSchedules => Set<HearingSchedule>();
    public DbSet<HearingParticipant> HearingParticipants => Set<HearingParticipant>();
    public DbSet<HearingAttachment> HearingAttachments => Set<HearingAttachment>();
    public DbSet<StatusChangeLog> StatusChangeLogs => Set<StatusChangeLog>();
    public DbSet<ConflictOfInterest> ConflictsOfInterest => Set<ConflictOfInterest>();
    public DbSet<CalendarSlot> CalendarSlots => Set<CalendarSlot>();
    public DbSet<CapacityRule> CapacityRules => Set<CapacityRule>();
    public DbSet<Reminder> Reminders => Set<Reminder>();
    public DbSet<User> Users => Set<User>();
    public DbSet<ClientFeedback> ClientFeedbacks => Set<ClientFeedback>();
    public DbSet<AuditTrail> AuditTrails => Set<AuditTrail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HearingCalendarDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
