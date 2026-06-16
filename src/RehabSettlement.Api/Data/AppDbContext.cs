using Microsoft.EntityFrameworkCore;
using RehabSettlement.Api.Models;

namespace RehabSettlement.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<SettlementBill> SettlementBills { get; set; }
    public DbSet<SettlementItem> SettlementItems { get; set; }
    public DbSet<Patient> Patients { get; set; }
    public DbSet<SourceChannel> SourceChannels { get; set; }
    public DbSet<ReviewTag> ReviewTags { get; set; }
    public DbSet<RejectionReason> RejectionReasons { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<TreatmentCalendar> TreatmentCalendars { get; set; }
    public DbSet<Device> Devices { get; set; }
    public DbSet<DeviceUsageRecord> DeviceUsageRecords { get; set; }
    public DbSet<NursingLog> NursingLogs { get; set; }
    public DbSet<StatusTransition> StatusTransitions { get; set; }
    public DbSet<ExceptionRecord> ExceptionRecords { get; set; }
    public DbSet<SupplementMaterial> SupplementMaterials { get; set; }
    public DbSet<BillReviewTag> BillReviewTags { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SettlementBill>()
            .HasOne(b => b.Patient)
            .WithMany(p => p.SettlementBills)
            .HasForeignKey(b => b.PatientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<SettlementBill>()
            .HasOne(b => b.Assignee)
            .WithMany(u => u.AssignedBills)
            .HasForeignKey(b => b.AssigneeId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<SettlementBill>()
            .HasOne(b => b.CreatedBy)
            .WithMany(u => u.CreatedBills)
            .HasForeignKey(b => b.CreatedById)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<TreatmentCalendar>()
            .HasOne(t => t.Doctor)
            .WithMany(u => u.DoctorTreatments)
            .HasForeignKey(t => t.DoctorId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<TreatmentCalendar>()
            .HasOne(t => t.Therapist)
            .WithMany(u => u.TherapistTreatments)
            .HasForeignKey(t => t.TherapistId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<NursingLog>()
            .HasOne(n => n.Nurse)
            .WithMany(u => u.NursingLogs)
            .HasForeignKey(n => n.NurseId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ExceptionRecord>()
            .HasOne(e => e.EscalatedToUser)
            .WithMany()
            .HasForeignKey(e => e.EscalatedTo)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<SettlementBill>()
            .HasIndex(b => b.StatusId);

        modelBuilder.Entity<SettlementBill>()
            .HasIndex(b => b.PatientId);

        modelBuilder.Entity<SettlementBill>()
            .HasIndex(b => b.AssigneeId);

        modelBuilder.Entity<SettlementBill>()
            .HasIndex(b => b.CreatedAt);

        modelBuilder.Entity<TreatmentCalendar>()
            .HasIndex(t => t.BillId);

        modelBuilder.Entity<TreatmentCalendar>()
            .HasIndex(t => t.TreatmentDate);

        modelBuilder.Entity<NursingLog>()
            .HasIndex(n => n.BillId);

        modelBuilder.Entity<NursingLog>()
            .HasIndex(n => n.LogDate);

        modelBuilder.Entity<StatusTransition>()
            .HasIndex(s => s.BillId);

        modelBuilder.Entity<StatusTransition>()
            .HasIndex(s => s.CreatedAt);

        modelBuilder.Entity<ExceptionRecord>()
            .HasIndex(e => e.BillId);

        modelBuilder.Entity<ExceptionRecord>()
            .HasIndex(e => e.IsClosed);
    }
}
