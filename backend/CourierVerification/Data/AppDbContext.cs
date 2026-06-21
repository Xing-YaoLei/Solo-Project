using CourierVerification.Enums;
using CourierVerification.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace CourierVerification.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Rider> Riders => Set<Rider>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<VerificationRecord> VerificationRecords => Set<VerificationRecord>();
    public DbSet<VerificationPhoto> VerificationPhotos => Set<VerificationPhoto>();
    public DbSet<VerificationAttachment> VerificationAttachments => Set<VerificationAttachment>();
    public DbSet<DamageReport> DamageReports => Set<DamageReport>();
    public DbSet<ReviewRecord> ReviewRecords => Set<ReviewRecord>();
    public DbSet<TimePoint> TimePoints => Set<TimePoint>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var splitConverter = new ValueConverter<List<string>, string>(
            v => string.Join(";", v ?? new List<string>()),
            v => string.IsNullOrEmpty(v) ? new List<string>() : v.Split(';', StringSplitOptions.RemoveEmptyEntries).ToList()
        );

        modelBuilder.Entity<Rider>(b =>
        {
            b.HasKey(r => r.Id);
            b.Property(r => r.Status).HasConversion<string>();
            b.Property(r => r.Rating).HasPrecision(18, 2);
            b.Property(r => r.Name).HasMaxLength(100).IsRequired();
            b.Property(r => r.Phone).HasMaxLength(20).IsRequired();
            b.Property(r => r.CreatedAt).HasColumnType("datetimeoffset");
            b.Property(r => r.UpdatedAt).HasColumnType("datetimeoffset");
        });

        modelBuilder.Entity<Order>(b =>
        {
            b.HasKey(o => o.Id);
            b.HasIndex(o => o.OrderNumber).IsUnique();
            b.Property(o => o.OrderNumber).HasMaxLength(50).IsRequired();
            b.Property(o => o.Status).HasConversion<string>();
            b.Property(o => o.CreatedAt).HasColumnType("datetimeoffset");
            b.Property(o => o.UpdatedAt).HasColumnType("datetimeoffset");
            b.HasOne(o => o.Rider).WithMany(r => r.Orders).HasForeignKey(o => o.RiderId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<VerificationRecord>(b =>
        {
            b.HasKey(v => v.Id);
            b.HasIndex(v => v.RecordNo).IsUnique();
            b.Property(v => v.RecordNo).HasMaxLength(50).IsRequired();
            b.Property(v => v.Stage).HasConversion<string>();
            b.Property(v => v.Status).HasConversion<string>();
            b.Property(v => v.RatingTags).HasConversion(splitConverter);
            b.Property(v => v.CreatedAt).HasColumnType("datetimeoffset");
            b.Property(v => v.UpdatedAt).HasColumnType("datetimeoffset");
            b.HasOne(v => v.Order).WithMany(o => o.VerificationRecords).HasForeignKey(v => v.OrderId).OnDelete(DeleteBehavior.Restrict);
            b.HasOne(v => v.Rider).WithMany(r => r.VerificationRecords).HasForeignKey(v => v.RiderId).OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<VerificationPhoto>(b =>
        {
            b.HasKey(p => p.Id);
            b.Property(p => p.PhotoType).HasConversion<string>();
            b.Property(p => p.UploadedAt).HasColumnType("datetimeoffset");
            b.HasOne(p => p.VerificationRecord).WithMany(v => v.Photos).HasForeignKey(p => p.VerificationRecordId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<VerificationAttachment>(b =>
        {
            b.HasKey(a => a.Id);
            b.Property(a => a.UploadedAt).HasColumnType("datetimeoffset");
            b.HasOne(a => a.VerificationRecord).WithMany(v => v.Attachments).HasForeignKey(a => a.VerificationRecordId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DamageReport>(b =>
        {
            b.HasKey(d => d.Id);
            b.Property(d => d.DamageRange).HasConversion<string>();
            b.Property(d => d.Severity).HasConversion<string>();
            b.Property(d => d.InitialResponsibility).HasConversion<string>();
            b.Property(d => d.FinalResponsibility).HasConversion<string>();
            b.Property(d => d.AffectedItems).HasConversion(splitConverter);
            b.Property(d => d.ReportedAt).HasColumnType("datetimeoffset");
            b.HasOne(d => d.VerificationRecord).WithMany(v => v.DamageReports).HasForeignKey(d => d.VerificationRecordId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ReviewRecord>(b =>
        {
            b.HasKey(r => r.Id);
            b.Property(r => r.ReviewedAt).HasColumnType("datetimeoffset");
            b.HasOne(r => r.VerificationRecord).WithMany(v => v.Reviews).HasForeignKey(r => r.VerificationRecordId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<TimePoint>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.PointTime).HasColumnType("datetimeoffset");
            b.HasOne(t => t.VerificationRecord).WithMany(v => v.TimePoints).HasForeignKey(t => t.VerificationRecordId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
