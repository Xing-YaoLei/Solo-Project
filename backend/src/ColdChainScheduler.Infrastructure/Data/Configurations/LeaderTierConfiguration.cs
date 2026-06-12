using ColdChainScheduler.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ColdChainScheduler.Infrastructure.Data.Configurations;

public class LeaderTierConfiguration : IEntityTypeConfiguration<LeaderTier>
{
    public void Configure(EntityTypeBuilder<LeaderTier> builder)
    {
        builder.ToTable("LeaderTiers");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.TierName).IsRequired().HasMaxLength(50);
        builder.Property(l => l.TierCode).IsRequired().HasMaxLength(20);
        builder.Property(l => l.MinOrderAmount).HasColumnType("decimal(18,2)");
        builder.Property(l => l.CommissionRate).HasColumnType("decimal(18,2)");
        builder.Property(l => l.Description).HasMaxLength(500);
        builder.HasIndex(l => l.TierCode).IsUnique();
    }
}
