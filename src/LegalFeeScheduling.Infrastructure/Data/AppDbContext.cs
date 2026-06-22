using LegalFeeScheduling.Domain.Common;
using LegalFeeScheduling.Domain.Entities;
using LegalFeeScheduling.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace LegalFeeScheduling.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Quote> Quotes => Set<Quote>();
    public DbSet<QuoteItem> QuoteItems => Set<QuoteItem>();
    public DbSet<PaymentRecord> PaymentRecords => Set<PaymentRecord>();
    public DbSet<ReconciliationRecord> ReconciliationRecords => Set<ReconciliationRecord>();
    public DbSet<StatusHistory> StatusHistories => Set<StatusHistory>();
    public DbSet<AmountCheckResult> AmountCheckResults => Set<AmountCheckResult>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var quoteStatusConverter = new ValueConverter<QuoteStatus, string>(
            v => v.ToString(),
            v => (QuoteStatus)Enum.Parse(typeof(QuoteStatus), v));

        var paymentStatusConverter = new ValueConverter<PaymentStatus, string>(
            v => v.ToString(),
            v => (PaymentStatus)Enum.Parse(typeof(PaymentStatus), v));

        var reconciliationStatusConverter = new ValueConverter<ReconciliationStatus, string>(
            v => v.ToString(),
            v => (ReconciliationStatus)Enum.Parse(typeof(ReconciliationStatus), v));

        var amountCheckTypeConverter = new ValueConverter<AmountCheckType, string>(
            v => v.ToString(),
            v => (AmountCheckType)Enum.Parse(typeof(AmountCheckType), v));

        var paymentMethodConverter = new ValueConverter<PaymentMethod, string>(
            v => v.ToString(),
            v => (PaymentMethod)Enum.Parse(typeof(PaymentMethod), v));

        var channelConverter = new ValueConverter<Channel, string>(
            v => v.ToString(),
            v => (Channel)Enum.Parse(typeof(Channel), v));

        modelBuilder.Entity<Quote>(builder =>
        {
            builder.Property(q => q.QuoteNo).IsRequired().HasMaxLength(50);
            builder.HasIndex(q => q.QuoteNo).IsUnique();
            builder.Property(q => q.CaseName).IsRequired().HasMaxLength(200);
            builder.Property(q => q.ClientName).IsRequired().HasMaxLength(200);
            builder.Property(q => q.Amount).HasPrecision(18, 2);
            builder.Property(q => q.DiscountAmount).HasPrecision(18, 2);
            builder.Property(q => q.FinalAmount).HasPrecision(18, 2);
            builder.Property(q => q.Status).HasConversion(quoteStatusConverter).HasMaxLength(50);
            builder.Property(q => q.Channel).HasConversion(channelConverter).HasMaxLength(50);
            builder.Property(q => q.CreatedBy).IsRequired().HasMaxLength(50);
            builder.Property(q => q.ApprovedBy).HasMaxLength(50);
            builder.Property(q => q.Owner).HasMaxLength(50);
            builder.Property(q => q.Remarks).HasMaxLength(1000);

            builder.HasMany(q => q.Items)
                .WithOne(qi => qi.Quote)
                .HasForeignKey(qi => qi.QuoteId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(q => q.Payments)
                .WithOne(pr => pr.Quote)
                .HasForeignKey(pr => pr.QuoteId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(q => q.Reconciliations)
                .WithOne(rr => rr.Quote)
                .HasForeignKey(rr => rr.QuoteId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(q => q.StatusHistories)
                .WithOne(sh => sh.Quote)
                .HasForeignKey(sh => sh.QuoteId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasMany(q => q.AmountChecks)
                .WithOne(acr => acr.Quote)
                .HasForeignKey(acr => acr.QuoteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuoteItem>(builder =>
        {
            builder.Property(qi => qi.ItemName).IsRequired().HasMaxLength(200);
            builder.Property(qi => qi.Description).HasMaxLength(500);
            builder.Property(qi => qi.UnitPrice).HasPrecision(18, 2);
            builder.Property(qi => qi.Subtotal).HasPrecision(18, 2);
        });

        modelBuilder.Entity<PaymentRecord>(builder =>
        {
            builder.Property(pr => pr.PaymentNo).IsRequired().HasMaxLength(50);
            builder.HasIndex(pr => pr.PaymentNo).IsUnique();
            builder.Property(pr => pr.Amount).HasPrecision(18, 2);
            builder.Property(pr => pr.Status).HasConversion(paymentStatusConverter).HasMaxLength(50);
            builder.Property(pr => pr.PaymentMethod).HasConversion(paymentMethodConverter).HasMaxLength(50);
            builder.Property(pr => pr.BankTransactionNo).HasMaxLength(100);
            builder.Property(pr => pr.Payer).HasMaxLength(100);
            builder.Property(pr => pr.CreatedBy).IsRequired().HasMaxLength(50);
            builder.Property(pr => pr.Remarks).HasMaxLength(1000);
        });

        modelBuilder.Entity<ReconciliationRecord>(builder =>
        {
            builder.Property(rr => rr.ExpectedAmount).HasPrecision(18, 2);
            builder.Property(rr => rr.ActualAmount).HasPrecision(18, 2);
            builder.Property(rr => rr.Difference).HasPrecision(18, 2);
            builder.Property(rr => rr.Status).HasConversion(reconciliationStatusConverter).HasMaxLength(50);
            builder.Property(rr => rr.ResolvedBy).HasMaxLength(50);
            builder.Property(rr => rr.Remarks).HasMaxLength(1000);
        });

        modelBuilder.Entity<StatusHistory>(builder =>
        {
            builder.Property(sh => sh.FromStatus).HasConversion(quoteStatusConverter).HasMaxLength(50);
            builder.Property(sh => sh.ToStatus).HasConversion(quoteStatusConverter).HasMaxLength(50);
            builder.Property(sh => sh.ChangedBy).HasMaxLength(50);
            builder.Property(sh => sh.Remarks).HasMaxLength(1000);
        });

        modelBuilder.Entity<AmountCheckResult>(builder =>
        {
            builder.Property(acr => acr.CheckType).HasConversion(amountCheckTypeConverter).HasMaxLength(50);
            builder.Property(acr => acr.ExpectedAmount).HasPrecision(18, 2);
            builder.Property(acr => acr.ActualAmount).HasPrecision(18, 2);
            builder.Property(acr => acr.Difference).HasPrecision(18, 2);
            builder.Property(acr => acr.CheckedBy).HasMaxLength(50);
            builder.Property(acr => acr.Remarks).HasMaxLength(1000);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
