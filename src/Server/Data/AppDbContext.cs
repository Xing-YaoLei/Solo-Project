using Microsoft.EntityFrameworkCore;
using SiteSchedule.Models;

namespace SiteSchedule.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Area> Areas { get; set; }
    public DbSet<PersonInCharge> PersonInCharges { get; set; }
    public DbSet<CustomerProfile> CustomerProfiles { get; set; }
    public DbSet<ConstructionSite> ConstructionSites { get; set; }
    public DbSet<AttachmentMaterial> AttachmentMaterials { get; set; }
    public DbSet<TagGroupRule> TagGroupRules { get; set; }
    public DbSet<AuthScopeThreshold> AuthScopeThresholds { get; set; }
    public DbSet<ScheduleConfirmation> ScheduleConfirmations { get; set; }
    public DbSet<TimelineChange> TimelineChanges { get; set; }
    public DbSet<MaterialSubmission> MaterialSubmissions { get; set; }
    public DbSet<NotificationRecord> NotificationRecords { get; set; }
    public DbSet<ActionLog> ActionLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ConstructionSite>()
            .HasOne(s => s.Customer)
            .WithMany(c => c.ConstructionSites)
            .HasForeignKey(s => s.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ConstructionSite>()
            .HasOne(s => s.Area)
            .WithMany(a => a.ConstructionSites)
            .HasForeignKey(s => s.AreaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ConstructionSite>()
            .HasOne(s => s.PersonInCharge)
            .WithMany(p => p.ConstructionSites)
            .HasForeignKey(s => s.PersonInChargeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ScheduleConfirmation>()
            .HasOne(c => c.Site)
            .WithMany(s => s.ScheduleConfirmations)
            .HasForeignKey(c => c.SiteId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TimelineChange>()
            .HasOne(t => t.Site)
            .WithMany(s => s.TimelineChanges)
            .HasForeignKey(t => t.SiteId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MaterialSubmission>()
            .HasOne(m => m.Site)
            .WithMany(s => s.MaterialSubmissions)
            .HasForeignKey(m => m.SiteId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<MaterialSubmission>()
            .HasOne(m => m.Confirmation)
            .WithMany(c => c.MaterialSubmissions)
            .HasForeignKey(m => m.ConfirmationId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<MaterialSubmission>()
            .HasOne(m => m.Material)
            .WithMany()
            .HasForeignKey(m => m.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<NotificationRecord>()
            .HasOne(n => n.Site)
            .WithMany(s => s.NotificationRecords)
            .HasForeignKey(n => n.SiteId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<NotificationRecord>()
            .HasOne(n => n.RecipientPerson)
            .WithMany()
            .HasForeignKey(n => n.RecipientPersonId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<ActionLog>()
            .HasOne(a => a.Site)
            .WithMany(s => s.ActionLogs)
            .HasForeignKey(a => a.SiteId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<TagGroupRule>()
            .HasOne(t => t.Area)
            .WithMany()
            .HasForeignKey(t => t.AreaId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<TagGroupRule>()
            .HasOne(t => t.PersonInCharge)
            .WithMany()
            .HasForeignKey(t => t.PersonInChargeId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<PersonInCharge>()
            .HasOne(p => p.Area)
            .WithMany()
            .HasForeignKey(p => p.AreaId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Area>().HasQueryFilter(a => a.IsActive);
        modelBuilder.Entity<PersonInCharge>().HasQueryFilter(p => p.IsActive);
        modelBuilder.Entity<AttachmentMaterial>().HasQueryFilter(a => a.IsActive);
        modelBuilder.Entity<TagGroupRule>().HasQueryFilter(t => t.IsActive);
        modelBuilder.Entity<AuthScopeThreshold>().HasQueryFilter(a => a.IsActive);
    }
}
