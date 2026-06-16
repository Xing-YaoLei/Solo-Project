using Microsoft.EntityFrameworkCore;
using PrescriptionReview.Domain.Entities;

namespace PrescriptionReview.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Store> Stores { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Prescription> Prescriptions { get; set; }
    public DbSet<PrescriptionItem> PrescriptionItems { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<SupplementNote> SupplementNotes { get; set; }
    public DbSet<PharmacistOpinion> PharmacistOpinions { get; set; }
    public DbSet<RestockOrder> RestockOrders { get; set; }
    public DbSet<RestockOrderItem> RestockOrderItems { get; set; }
    public DbSet<InsuranceRecord> InsuranceRecords { get; set; }
    public DbSet<FollowUp> FollowUps { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Prescription>()
            .HasOne(p => p.Store)
            .WithMany()
            .HasForeignKey(p => p.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Prescription>()
            .HasOne(p => p.Cashier)
            .WithMany()
            .HasForeignKey(p => p.CashierId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Prescription>()
            .HasOne(p => p.Pharmacist)
            .WithMany()
            .HasForeignKey(p => p.PharmacistId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PrescriptionItem>()
            .HasOne(pi => pi.Prescription)
            .WithMany(p => p.Items)
            .HasForeignKey(pi => pi.PrescriptionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Attachment>()
            .HasOne(a => a.Prescription)
            .WithMany(p => p.Attachments)
            .HasForeignKey(a => a.PrescriptionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<AuditLog>()
            .HasOne(al => al.Prescription)
            .WithMany(p => p.AuditLogs)
            .HasForeignKey(al => al.PrescriptionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<SupplementNote>()
            .HasOne(sn => sn.Prescription)
            .WithMany(p => p.SupplementNotes)
            .HasForeignKey(sn => sn.PrescriptionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<PharmacistOpinion>()
            .HasOne(po => po.Prescription)
            .WithMany(p => p.PharmacistOpinions)
            .HasForeignKey(po => po.PrescriptionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RestockOrder>()
            .HasOne(ro => ro.Store)
            .WithMany()
            .HasForeignKey(ro => ro.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RestockOrder>()
            .HasOne(ro => ro.Prescription)
            .WithMany()
            .HasForeignKey(ro => ro.PrescriptionId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<RestockOrderItem>()
            .HasOne(roi => roi.RestockOrder)
            .WithMany(ro => ro.Items)
            .HasForeignKey(roi => roi.RestockOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<InsuranceRecord>()
            .HasOne(ir => ir.Store)
            .WithMany()
            .HasForeignKey(ir => ir.StoreId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<InsuranceRecord>()
            .HasOne(ir => ir.Prescription)
            .WithMany()
            .HasForeignKey(ir => ir.PrescriptionId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<FollowUp>()
            .HasOne(f => f.Prescription)
            .WithOne(p => p.FollowUp)
            .HasForeignKey<FollowUp>(f => f.PrescriptionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<Prescription>()
            .HasIndex(p => p.PrescriptionNo)
            .IsUnique();

        modelBuilder.Entity<RestockOrder>()
            .HasIndex(ro => ro.OrderNo)
            .IsUnique();

        modelBuilder.Entity<InsuranceRecord>()
            .HasIndex(ir => ir.RecordNo)
            .IsUnique();
    }
}
