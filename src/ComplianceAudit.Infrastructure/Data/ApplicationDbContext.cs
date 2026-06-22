using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using ComplianceAudit.Core.Entities;

namespace ComplianceAudit.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, long>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public required DbSet<Regulation> Regulations { get; set; }
    public required DbSet<AuditSchedule> AuditSchedules { get; set; }
    public required DbSet<ChecklistTemplate> ChecklistTemplates { get; set; }
    public required DbSet<ChecklistTemplateItem> ChecklistTemplateItems { get; set; }
    public required DbSet<ChecklistItem> ChecklistItems { get; set; }
    public required DbSet<SamplingRecord> SamplingRecords { get; set; }
    public required DbSet<CheckRecord> CheckRecords { get; set; }
    public required DbSet<Rectification> Rectifications { get; set; }
    public required DbSet<Evidence> Evidences { get; set; }
    public required DbSet<EvidenceMissingRecord> EvidenceMissingRecords { get; set; }
    public required DbSet<ProcessingHistory> ProcessingHistories { get; set; }
    public required DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Regulation>(e =>
        {
            e.HasIndex(r => r.RegulationNo).IsUnique();
            e.Property(r => r.Title).HasMaxLength(500).IsRequired();
            e.Property(r => r.Category).HasMaxLength(200).IsRequired();
            e.Property(r => r.RegulationNo).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<AuditSchedule>(e =>
        {
            e.HasIndex(s => s.ScheduleNo).IsUnique();
            e.HasIndex(s => s.AuditorId);
            e.HasIndex(s => s.Status);
            e.HasIndex(s => s.DueDate);
            e.Property(s => s.ScheduleNo).HasMaxLength(100).IsRequired();
            e.Property(s => s.Title).HasMaxLength(500).IsRequired();
            e.HasOne(s => s.Regulation)
                .WithMany(r => r.Schedules)
                .HasForeignKey(s => s.RegulationId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(s => s.Auditor)
                .WithMany(u => u.AssignedSchedules)
                .HasForeignKey(s => s.AuditorId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(s => s.BusinessOwner)
                .WithMany()
                .HasForeignKey(s => s.BusinessOwnerId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ChecklistTemplate>(e =>
        {
            e.Property(ct => ct.Name).HasMaxLength(500).IsRequired();
            e.HasOne(ct => ct.Regulation)
                .WithMany(r => r.ChecklistTemplates)
                .HasForeignKey(ct => ct.RegulationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChecklistTemplateItem>(e =>
        {
            e.Property(ci => ci.ItemNo).HasMaxLength(100).IsRequired();
            e.Property(ci => ci.Content).HasMaxLength(2000).IsRequired();
            e.HasOne(ci => ci.Template)
                .WithMany(ct => ct.Items)
                .HasForeignKey(ci => ci.TemplateId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ChecklistItem>(e =>
        {
            e.HasIndex(ci => ci.ScheduleId);
            e.HasIndex(ci => ci.Status);
            e.Property(ci => ci.ItemNo).HasMaxLength(100).IsRequired();
            e.Property(ci => ci.Content).HasMaxLength(2000).IsRequired();
            e.HasOne(ci => ci.Schedule)
                .WithMany(s => s.ChecklistItems)
                .HasForeignKey(ci => ci.ScheduleId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ci => ci.TemplateItem)
                .WithMany()
                .HasForeignKey(ci => ci.TemplateItemId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SamplingRecord>(e =>
        {
            e.HasIndex(sr => sr.ScheduleId);
            e.HasIndex(sr => sr.SamplingNo).IsUnique();
            e.HasIndex(sr => sr.DocumentNo);
            e.HasIndex(sr => sr.Status);
            e.Property(sr => sr.SamplingNo).HasMaxLength(100).IsRequired();
            e.Property(sr => sr.DocumentNo).HasMaxLength(200).IsRequired();
            e.Property(sr => sr.SourceSystem).HasMaxLength(200).IsRequired();
            e.Property(sr => sr.SourceModule).HasMaxLength(200).IsRequired();
            e.HasOne(sr => sr.Schedule)
                .WithMany(s => s.SamplingRecords)
                .HasForeignKey(sr => sr.ScheduleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CheckRecord>(e =>
        {
            e.HasIndex(cr => cr.ScheduleId);
            e.HasIndex(cr => cr.ChecklistItemId);
            e.HasIndex(cr => cr.SamplingRecordId);
            e.HasIndex(cr => cr.Status);
            e.HasOne(cr => cr.Schedule)
                .WithMany(s => s.CheckRecords)
                .HasForeignKey(cr => cr.ScheduleId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(cr => cr.ChecklistItem)
                .WithMany(ci => ci.CheckRecords)
                .HasForeignKey(cr => cr.ChecklistItemId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(cr => cr.SamplingRecord)
                .WithMany(sr => sr.CheckRecords)
                .HasForeignKey(cr => cr.SamplingRecordId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Rectification>(e =>
        {
            e.HasIndex(r => r.ScheduleId);
            e.HasIndex(r => r.OwnerId);
            e.HasIndex(r => r.Status);
            e.HasIndex(r => r.Deadline);
            e.Property(r => r.RectificationNo).HasMaxLength(100).IsRequired();
            e.Property(r => r.Title).HasMaxLength(500).IsRequired();
            e.Property(r => r.Description).HasMaxLength(2000).IsRequired();
            e.HasOne(r => r.Schedule)
                .WithMany(s => s.Rectifications)
                .HasForeignKey(r => r.ScheduleId)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(r => r.CheckRecord)
                .WithMany(cr => cr.Rectifications)
                .HasForeignKey(r => r.CheckRecordId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(r => r.Owner)
                .WithMany(u => u.AssignedRectifications)
                .HasForeignKey(r => r.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Evidence>(e =>
        {
            e.HasIndex(e => e.CheckRecordId);
            e.HasIndex(e => e.ChecklistItemId);
            e.HasIndex(e => e.SamplingRecordId);
            e.HasIndex(e => e.RectificationId);
            e.Property(ev => ev.FileName).HasMaxLength(500).IsRequired();
            e.Property(ev => ev.FileUrl).HasMaxLength(2000).IsRequired();
            e.Property(ev => ev.ContentType).HasMaxLength(200).IsRequired();
            e.HasOne(ev => ev.CheckRecord)
                .WithMany(cr => cr.Evidences)
                .HasForeignKey(ev => ev.CheckRecordId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(ev => ev.ChecklistItem)
                .WithMany(ci => ci.Evidences)
                .HasForeignKey(ev => ev.ChecklistItemId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(ev => ev.SamplingRecord)
                .WithMany(sr => sr.Evidences)
                .HasForeignKey(ev => ev.SamplingRecordId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(ev => ev.Rectification)
                .WithMany(r => r.Evidences)
                .HasForeignKey(ev => ev.RectificationId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<EvidenceMissingRecord>(e =>
        {
            e.HasIndex(emr => emr.CheckRecordId);
            e.HasIndex(emr => emr.Status);
            e.HasIndex(emr => emr.ResponsibleId);
            e.Property(emr => emr.MissingNo).HasMaxLength(100).IsRequired();
            e.Property(emr => emr.MissingDescription).HasMaxLength(2000).IsRequired();
            e.HasOne(emr => emr.CheckRecord)
                .WithMany(cr => cr.EvidenceMissingRecords)
                .HasForeignKey(emr => emr.CheckRecordId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(emr => emr.ChecklistItem)
                .WithMany(ci => ci.EvidenceMissingRecords)
                .HasForeignKey(emr => emr.ChecklistItemId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProcessingHistory>(e =>
        {
            e.HasIndex(ph => new { ph.EntityType, ph.EntityId });
            e.HasIndex(ph => ph.OperatorId);
            e.HasIndex(ph => ph.OperatedAt);
            e.Property(ph => ph.EntityType).HasMaxLength(100).IsRequired();
            e.Property(ph => ph.ActionType).HasMaxLength(100).IsRequired();
            e.Property(ph => ph.Description).HasMaxLength(1000).IsRequired();
            e.Property(ph => ph.BatchId).HasMaxLength(100);
        });

        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasIndex(al => al.UserId);
            e.HasIndex(al => al.Timestamp);
            e.HasIndex(al => new { al.EntityName, al.EntityId });
            e.Property(al => al.UserName).HasMaxLength(256).IsRequired();
            e.Property(al => al.Action).HasMaxLength(100).IsRequired();
            e.Property(al => al.EntityName).HasMaxLength(200).IsRequired();
            e.Property(al => al.IPAddress).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<ApplicationUser>(e =>
        {
            e.Property(u => u.FullName).HasMaxLength(256).IsRequired();
            e.Property(u => u.EmployeeId).HasMaxLength(100);
            e.Property(u => u.Department).HasMaxLength(200);
        });

        modelBuilder.Entity<ApplicationRole>(e =>
        {
            e.Property(r => r.Description).HasMaxLength(500);
        });
    }
}

public class ApplicationRole : IdentityRole<long>
{
    public string? Description { get; set; }
}
