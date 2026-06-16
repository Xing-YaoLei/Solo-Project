using DentalClinic.API.Models;
using DentalClinic.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Patient> Patients { get; set; }
    public DbSet<TreatmentPlan> TreatmentPlans { get; set; }
    public DbSet<TreatmentPlanItem> TreatmentPlanItems { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<FollowUpTask> FollowUpTasks { get; set; }
    public DbSet<BillingRecord> BillingRecords { get; set; }
    public DbSet<BillingItem> BillingItems { get; set; }
    public DbSet<ImageAttachment> ImageAttachments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Patient>(entity =>
        {
            entity.HasIndex(p => p.PatientNo).IsUnique();
            entity.HasIndex(p => p.Phone);
            entity.HasIndex(p => p.Name);
        });

        modelBuilder.Entity<TreatmentPlan>(entity =>
        {
            entity.HasOne(tp => tp.Patient)
                  .WithMany(p => p.TreatmentPlans)
                  .HasForeignKey(tp => tp.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TreatmentPlanItem>(entity =>
        {
            entity.HasOne(tpi => tpi.TreatmentPlan)
                  .WithMany(tp => tp.PlanItems)
                  .HasForeignKey(tpi => tpi.TreatmentPlanId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.HasOne(a => a.Patient)
                  .WithMany(p => p.Appointments)
                  .HasForeignKey(a => a.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.TreatmentPlan)
                  .WithMany(tp => tp.Appointments)
                  .HasForeignKey(a => a.TreatmentPlanId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(a => a.AppointmentDate);
            entity.HasIndex(a => a.Status);
        });

        modelBuilder.Entity<FollowUpTask>(entity =>
        {
            entity.HasOne(ft => ft.Patient)
                  .WithMany(p => p.FollowUpTasks)
                  .HasForeignKey(ft => ft.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ft => ft.Appointment)
                  .WithMany(a => a.FollowUpTasks)
                  .HasForeignKey(ft => ft.AppointmentId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(ft => ft.TreatmentPlan)
                  .WithMany()
                  .HasForeignKey(ft => ft.TreatmentPlanId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<BillingRecord>(entity =>
        {
            entity.HasOne(br => br.Patient)
                  .WithMany(p => p.BillingRecords)
                  .HasForeignKey(br => br.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(br => br.Appointment)
                  .WithMany(a => a.BillingRecords)
                  .HasForeignKey(br => br.AppointmentId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(br => br.InvoiceNo).IsUnique();
        });

        modelBuilder.Entity<BillingItem>(entity =>
        {
            entity.HasOne(bi => bi.BillingRecord)
                  .WithMany(br => br.BillingItems)
                  .HasForeignKey(bi => bi.BillingRecordId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ImageAttachment>(entity =>
        {
            entity.HasOne(ia => ia.Patient)
                  .WithMany(p => p.ImageAttachments)
                  .HasForeignKey(ia => ia.PatientId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ia => ia.Appointment)
                  .WithMany(a => a.ImageAttachments)
                  .HasForeignKey(ia => ia.AppointmentId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(ia => ia.TreatmentPlan)
                  .WithMany()
                  .HasForeignKey(ia => ia.TreatmentPlanId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
