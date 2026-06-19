using Microsoft.EntityFrameworkCore;
using ScenicTicketBooking.Domain.Entities;

namespace ScenicTicketBooking.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<ScenicSpot> ScenicSpots { get; set; }
    public DbSet<TimeSlot> TimeSlots { get; set; }
    public DbSet<TicketType> TicketTypes { get; set; }
    public DbSet<Visitor> Visitors { get; set; }
    public DbSet<TicketBooking> TicketBookings { get; set; }
    public DbSet<RescheduleRecord> RescheduleRecords { get; set; }
    public DbSet<ConflictLog> ConflictLogs { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<ReminderList> ReminderLists { get; set; }
    public DbSet<ReminderListItem> ReminderListItems { get; set; }
    public DbSet<ReminderListChangeLog> ReminderListChangeLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ScenicSpot>()
            .HasMany(s => s.TimeSlots)
            .WithOne(t => t.ScenicSpot)
            .HasForeignKey(t => t.ScenicSpotId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ScenicSpot>()
            .HasMany(s => s.TicketTypes)
            .WithOne(t => t.ScenicSpot)
            .HasForeignKey(t => t.ScenicSpotId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ScenicSpot>()
            .HasMany(s => s.Bookings)
            .WithOne(b => b.ScenicSpot)
            .HasForeignKey(b => b.ScenicSpotId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TimeSlot>()
            .HasMany(t => t.Bookings)
            .WithOne(b => b.TimeSlot)
            .HasForeignKey(b => b.TimeSlotId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TicketType>()
            .HasMany(t => t.Bookings)
            .WithOne(b => b.TicketType)
            .HasForeignKey(b => b.TicketTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Visitor>()
            .HasMany(v => v.Bookings)
            .WithOne(b => b.Visitor)
            .HasForeignKey(b => b.VisitorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<TicketBooking>()
            .HasMany(b => b.RescheduleRecords)
            .WithOne(r => r.Booking)
            .HasForeignKey(r => r.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TicketBooking>()
            .HasMany(b => b.ConflictLogs)
            .WithOne(c => c.Booking)
            .HasForeignKey(c => c.BookingId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ReminderList>()
            .HasMany(r => r.Items)
            .WithOne(i => i.ReminderList)
            .HasForeignKey(i => i.ReminderListId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ReminderList>()
            .HasMany(r => r.ChangeLogs)
            .WithOne(c => c.ReminderList)
            .HasForeignKey(c => c.ReminderListId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TimeSlot>()
            .HasIndex(t => new { t.ScenicSpotId, t.Date, t.StartTime, t.EndTime })
            .HasDatabaseName("IX_TimeSlots_ScenicDateRange");

        modelBuilder.Entity<TicketBooking>()
            .HasIndex(b => b.BookingNo)
            .IsUnique()
            .HasDatabaseName("IX_TicketBookings_BookingNo");

        modelBuilder.Entity<Visitor>()
            .HasIndex(v => v.IdCardNumber)
            .HasDatabaseName("IX_Visitors_IdCardNumber");

        modelBuilder.Entity<ConflictLog>()
            .HasIndex(c => c.Status)
            .HasDatabaseName("IX_ConflictLogs_Status");

        modelBuilder.Entity<ConflictLog>()
            .HasIndex(c => new { c.Status, c.CreatedAt })
            .HasDatabaseName("IX_ConflictLogs_StatusCreatedAt");

        modelBuilder.Entity<Notification>()
            .HasIndex(n => n.IsRead)
            .HasDatabaseName("IX_Notifications_IsRead");
    }
}
