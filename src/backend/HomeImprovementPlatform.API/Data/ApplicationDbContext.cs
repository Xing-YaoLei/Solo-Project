using HomeImprovementPlatform.API.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HomeImprovementPlatform.API.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Project> Projects { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<DocumentItem> DocumentItems { get; set; }
    public DbSet<Material> Materials { get; set; }
    public DbSet<ApprovalNode> ApprovalNodes { get; set; }
    public DbSet<PaymentRecord> PaymentRecords { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<DocumentHistory> DocumentHistories { get; set; }
    public DbSet<ScheduleTask> ScheduleTasks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<ApplicationUser>(b =>
        {
            b.Property(u => u.FullName).HasMaxLength(100);
            b.Property(u => u.Role).IsRequired();
        });

        modelBuilder.Entity<Project>(b =>
        {
            b.HasKey(p => p.Id);
            b.Property(p => p.ProjectNumber).HasMaxLength(50).IsRequired();
            b.Property(p => p.Name).HasMaxLength(200).IsRequired();
            b.Property(p => p.Address).HasMaxLength(500).IsRequired();
            b.Property(p => p.TotalBudget).HasColumnType("decimal(18,2)");
            b.Property(p => p.ActualAmount).HasColumnType("decimal(18,2)");
            b.Property(p => p.Status).IsRequired();

            b.HasOne(p => p.Owner)
                .WithMany(u => u.OwnedProjects)
                .HasForeignKey(p => p.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(p => p.Designer)
                .WithMany(u => u.DesignerProjects)
                .HasForeignKey(p => p.DesignerId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(p => p.Foreman)
                .WithMany(u => u.ForemanProjects)
                .HasForeignKey(p => p.ForemanId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(p => p.Supervisor)
                .WithMany(u => u.SupervisorProjects)
                .HasForeignKey(p => p.SupervisorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Document>(b =>
        {
            b.HasKey(d => d.Id);
            b.Property(d => d.DocumentNumber).HasMaxLength(50).IsRequired();
            b.Property(d => d.Title).HasMaxLength(200).IsRequired();
            b.Property(d => d.ExpectedAmount).HasColumnType("decimal(18,2)");
            b.Property(d => d.ActualAmount).HasColumnType("decimal(18,2)");
            b.Property(d => d.Type).IsRequired();
            b.Property(d => d.Status).IsRequired();
            b.Property(d => d.AmountConsistency).IsRequired();

            b.HasOne(d => d.Project)
                .WithMany(p => p.Documents)
                .HasForeignKey(d => d.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(d => d.CreatedBy)
                .WithMany()
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DocumentItem>(b =>
        {
            b.HasKey(di => di.Id);
            b.Property(di => di.ItemCode).HasMaxLength(50);
            b.Property(di => di.Name).HasMaxLength(200).IsRequired();
            b.Property(di => di.Specification).HasMaxLength(500);
            b.Property(di => di.Unit).HasMaxLength(20).IsRequired();
            b.Property(di => di.Quantity).HasColumnType("decimal(18,4)");
            b.Property(di => di.UnitPrice).HasColumnType("decimal(18,2)");
            b.Property(di => di.Subtotal).HasColumnType("decimal(18,2)");

            b.HasOne(di => di.Document)
                .WithMany(d => d.Items)
                .HasForeignKey(di => di.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(di => di.Material)
                .WithMany(m => m.DocumentItems)
                .HasForeignKey(di => di.MaterialId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Material>(b =>
        {
            b.HasKey(m => m.Id);
            b.Property(m => m.MaterialCode).HasMaxLength(50).IsRequired();
            b.Property(m => m.Name).HasMaxLength(200).IsRequired();
            b.Property(m => m.Specification).HasMaxLength(500);
            b.Property(m => m.Brand).HasMaxLength(100);
            b.Property(m => m.Unit).HasMaxLength(20).IsRequired();
            b.Property(m => m.StandardPrice).HasColumnType("decimal(18,2)");
            b.Property(m => m.Category).HasMaxLength(100);
        });

        modelBuilder.Entity<ApprovalNode>(b =>
        {
            b.HasKey(an => an.Id);
            b.Property(an => an.NodeName).HasMaxLength(100).IsRequired();
            b.Property(an => an.TargetStatus).IsRequired();
            b.Property(an => an.Comments).HasMaxLength(1000);

            b.HasOne(an => an.Document)
                .WithMany(d => d.ApprovalNodes)
                .HasForeignKey(an => an.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(an => an.Approver)
                .WithMany(u => u.ApprovalNodes)
                .HasForeignKey(an => an.ApproverId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PaymentRecord>(b =>
        {
            b.HasKey(pr => pr.Id);
            b.Property(pr => pr.PaymentNumber).HasMaxLength(50).IsRequired();
            b.Property(pr => pr.PaymentType).HasMaxLength(50).IsRequired();
            b.Property(pr => pr.Amount).HasColumnType("decimal(18,2)");
            b.Property(pr => pr.Status).IsRequired();
            b.Property(pr => pr.TransactionId).HasMaxLength(100);
            b.Property(pr => pr.PaymentMethod).HasMaxLength(50);
            b.Property(pr => pr.Remarks).HasMaxLength(500);

            b.HasOne(pr => pr.Project)
                .WithMany(p => p.PaymentRecords)
                .HasForeignKey(pr => pr.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(pr => pr.Document)
                .WithMany()
                .HasForeignKey(pr => pr.DocumentId)
                .OnDelete(DeleteBehavior.SetNull);

            b.HasOne(pr => pr.RecordedBy)
                .WithMany(u => u.PaymentRecords)
                .HasForeignKey(pr => pr.RecordedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Attachment>(b =>
        {
            b.HasKey(a => a.Id);
            b.Property(a => a.FileName).HasMaxLength(255).IsRequired();
            b.Property(a => a.OriginalFileName).HasMaxLength(255).IsRequired();
            b.Property(a => a.FilePath).HasMaxLength(500).IsRequired();
            b.Property(a => a.ContentType).HasMaxLength(100).IsRequired();
            b.Property(a => a.Description).HasMaxLength(500);

            b.HasOne(a => a.Document)
                .WithMany(d => d.Attachments)
                .HasForeignKey(a => a.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(a => a.UploadedBy)
                .WithMany()
                .HasForeignKey(a => a.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DocumentHistory>(b =>
        {
            b.HasKey(dh => dh.Id);
            b.Property(dh => dh.Action).HasMaxLength(100).IsRequired();
            b.Property(dh => dh.Conclusion).HasMaxLength(1000);
            b.Property(dh => dh.Source).HasMaxLength(200);

            b.HasOne(dh => dh.Document)
                .WithMany(d => d.DocumentHistories)
                .HasForeignKey(dh => dh.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(dh => dh.CreatedBy)
                .WithMany(u => u.DocumentHistories)
                .HasForeignKey(dh => dh.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ScheduleTask>(b =>
        {
            b.HasKey(st => st.Id);
            b.Property(st => st.TaskName).HasMaxLength(200).IsRequired();
            b.Property(st => st.Description).HasMaxLength(1000);
            b.Property(st => st.Notes).HasMaxLength(500);
            b.Property(st => st.Status).IsRequired();

            b.HasOne(st => st.Project)
                .WithMany(p => p.ScheduleTasks)
                .HasForeignKey(st => st.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            b.HasOne(st => st.AssignedTo)
                .WithMany()
                .HasForeignKey(st => st.AssignedToId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
