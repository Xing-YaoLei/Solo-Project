using FitnessDietTracker.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessDietTracker.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<DietRecord> DietRecords { get; set; }
    public DbSet<CheckInPhoto> CheckInPhotos { get; set; }
    public DbSet<BodyMeasurement> BodyMeasurements { get; set; }
    public DbSet<CoachComment> CoachComments { get; set; }
    public DbSet<CoachCommentHistory> CoachCommentHistories { get; set; }
    public DbSet<CheckInInterruption> CheckInInterruptions { get; set; }
    public DbSet<InterruptionLog> InterruptionLogs { get; set; }
    public DbSet<ExportRecord> ExportRecords { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasOne(u => u.Coach)
            .WithMany(u => u.Clients)
            .HasForeignKey(u => u.CoachId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<DietRecord>()
            .HasOne(d => d.User)
            .WithMany(u => u.DietRecords)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CheckInPhoto>()
            .HasOne(p => p.DietRecord)
            .WithMany(d => d.Photos)
            .HasForeignKey(p => p.DietRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BodyMeasurement>()
            .HasOne(b => b.User)
            .WithMany(u => u.BodyMeasurements)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CoachComment>()
            .HasOne(c => c.DietRecord)
            .WithOne(d => d.CoachComment)
            .HasForeignKey<CoachComment>(c => c.DietRecordId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CoachComment>()
            .HasOne(c => c.Coach)
            .WithMany()
            .HasForeignKey(c => c.CoachId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CoachCommentHistory>()
            .HasOne(h => h.CoachComment)
            .WithMany(c => c.Histories)
            .HasForeignKey(h => h.CoachCommentId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CheckInInterruption>()
            .HasOne(i => i.User)
            .WithMany(u => u.Interruptions)
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InterruptionLog>()
            .HasOne(l => l.Interruption)
            .WithMany(i => i.Logs)
            .HasForeignKey(l => l.InterruptionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InterruptionLog>()
            .HasOne(l => l.Operator)
            .WithMany()
            .HasForeignKey(l => l.OperatorId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ExportRecord>()
            .HasOne(e => e.Operator)
            .WithMany()
            .HasForeignKey(e => e.OperatorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Notification>()
            .HasOne(n => n.Creator)
            .WithMany()
            .HasForeignKey(n => n.CreatedBy)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Notification>().HasIndex(n => new { n.UserId, n.Status });
        modelBuilder.Entity<Notification>().HasIndex(n => n.CreatedAt);

        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.UserName).IsUnique();
        modelBuilder.Entity<DietRecord>().HasIndex(d => new { d.UserId, d.RecordDate, d.MealType });
        modelBuilder.Entity<BodyMeasurement>().HasIndex(b => new { b.UserId, b.MeasureDate });
    }
}
