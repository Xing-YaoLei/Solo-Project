using ColdChainScheduler.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ColdChainScheduler.Infrastructure.Data.Configurations;

public class SettlementSheetConfiguration : IEntityTypeConfiguration<SettlementSheet>
{
    public void Configure(EntityTypeBuilder<SettlementSheet> builder)
    {
        builder.ToTable("SettlementSheets");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.SheetNo).IsRequired().HasMaxLength(50);
        builder.Property(s => s.TotalAmount).HasColumnType("decimal(18,2)");
        builder.Property(s => s.CaliberNote).HasMaxLength(2000);
        builder.HasIndex(s => s.SheetNo).IsUnique();
        builder.HasOne(s => s.GroupBatch)
            .WithMany(g => g.SettlementSheets)
            .HasForeignKey(s => s.GroupBatchId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(s => s.LeaderTier)
            .WithMany(l => l.SettlementSheets)
            .HasForeignKey(s => s.LeaderTierId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(s => s.Items)
            .WithOne(i => i.SettlementSheet)
            .HasForeignKey(i => i.SettlementSheetId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
