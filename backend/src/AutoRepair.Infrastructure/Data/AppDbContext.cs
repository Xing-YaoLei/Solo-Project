using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using AutoRepair.Application.Interfaces;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser>, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<WorkOrder> WorkOrders { get; set; }
    public DbSet<WorkOrderItem> WorkOrderItems { get; set; }
    public DbSet<Diagnosis> Diagnoses { get; set; }
    public DbSet<Part> Parts { get; set; }
    public DbSet<PartInventory> PartInventories { get; set; }
    public DbSet<StockAlert> StockAlerts { get; set; }
    public DbSet<Quote> Quotes { get; set; }
    public DbSet<QuoteItem> QuoteItems { get; set; }
    public DbSet<CommunicationLog> CommunicationLogs { get; set; }
    public DbSet<ReviewOpinion> ReviewOpinions { get; set; }
    public DbSet<MaintenanceReminder> MaintenanceReminders { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Vehicle>()
            .HasIndex(v => v.LicensePlate)
            .IsUnique();

        builder.Entity<Vehicle>()
            .HasIndex(v => v.VinCode)
            .IsUnique();

        builder.Entity<WorkOrder>()
            .HasIndex(w => w.OrderNumber)
            .IsUnique();

        builder.Entity<WorkOrder>()
            .HasOne(w => w.Vehicle)
            .WithMany(v => v.WorkOrders)
            .HasForeignKey(w => w.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<WorkOrder>()
            .HasOne(w => w.AssignedToUser)
            .WithMany(u => u.AssignedWorkOrders)
            .HasForeignKey(w => w.AssignedToUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<WorkOrder>()
            .HasOne(w => w.OriginalOrder)
            .WithMany()
            .HasForeignKey(w => w.OriginalOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Diagnosis>()
            .HasOne(d => d.Vehicle)
            .WithMany(v => v.Diagnoses)
            .HasForeignKey(d => d.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Diagnosis>()
            .HasOne(d => d.WorkOrder)
            .WithMany(w => w.Diagnoses)
            .HasForeignKey(d => d.WorkOrderId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Diagnosis>()
            .HasOne(d => d.DiagnosedByUser)
            .WithMany(u => u.Diagnoses)
            .HasForeignKey(d => d.DiagnosedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<WorkOrderItem>()
            .HasOne(i => i.WorkOrder)
            .WithMany(w => w.Items)
            .HasForeignKey(i => i.WorkOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<WorkOrderItem>()
            .HasOne(i => i.Part)
            .WithMany(p => p.WorkOrderItems)
            .HasForeignKey(i => i.PartId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Part>()
            .HasIndex(p => p.PartNumber)
            .IsUnique();

        builder.Entity<Part>()
            .HasOne(p => p.Inventory)
            .WithOne(i => i.Part)
            .HasForeignKey<PartInventory>(i => i.PartId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StockAlert>()
            .HasOne(s => s.PartInventory)
            .WithMany(i => i.StockAlerts)
            .HasForeignKey(s => s.PartInventoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StockAlert>()
            .HasOne(s => s.AcknowledgedByUser)
            .WithMany()
            .HasForeignKey(s => s.AcknowledgedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Quote>()
            .HasIndex(q => q.QuoteNumber)
            .IsUnique();

        builder.Entity<Quote>()
            .HasOne(q => q.WorkOrder)
            .WithMany(w => w.Quotes)
            .HasForeignKey(q => q.WorkOrderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Quote>()
            .HasOne(q => q.CreatedByUser)
            .WithMany(u => u.CreatedQuotes)
            .HasForeignKey(q => q.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<QuoteItem>()
            .HasOne(i => i.Quote)
            .WithMany(q => q.Items)
            .HasForeignKey(i => i.QuoteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<QuoteItem>()
            .HasOne(i => i.Part)
            .WithMany()
            .HasForeignKey(i => i.PartId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<CommunicationLog>()
            .HasOne(c => c.StockAlert)
            .WithMany(s => s.CommunicationLogs)
            .HasForeignKey(c => c.StockAlertId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<CommunicationLog>()
            .HasOne(c => c.Quote)
            .WithMany()
            .HasForeignKey(c => c.QuoteId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<CommunicationLog>()
            .HasOne(c => c.WorkOrder)
            .WithMany()
            .HasForeignKey(c => c.WorkOrderId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<CommunicationLog>()
            .HasOne(c => c.FromUser)
            .WithMany(u => u.SentMessages)
            .HasForeignKey(c => c.FromUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<CommunicationLog>()
            .HasOne(c => c.ToUser)
            .WithMany(u => u.ReceivedMessages)
            .HasForeignKey(c => c.ToUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<ReviewOpinion>()
            .HasOne(r => r.Quote)
            .WithMany(q => q.ReviewOpinions)
            .HasForeignKey(r => r.QuoteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ReviewOpinion>()
            .HasOne(r => r.WorkOrder)
            .WithMany()
            .HasForeignKey(r => r.WorkOrderId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<ReviewOpinion>()
            .HasOne(r => r.StockAlert)
            .WithMany(s => s.ReviewOpinions)
            .HasForeignKey(r => r.StockAlertId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ReviewOpinion>()
            .HasOne(r => r.ReviewerUser)
            .WithMany(u => u.ReviewOpinions)
            .HasForeignKey(r => r.ReviewerUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<MaintenanceReminder>()
            .HasOne(m => m.Vehicle)
            .WithMany()
            .HasForeignKey(m => m.VehicleId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
