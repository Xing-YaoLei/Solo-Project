using ColdChainScheduler.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ColdChainScheduler.Infrastructure.Data.Configurations;

public class GroupBatchConfiguration : IEntityTypeConfiguration<GroupBatch>
{
    public void Configure(EntityTypeBuilder<GroupBatch> builder)
    {
        builder.ToTable("GroupBatches");
        builder.HasKey(g => g.Id);
        builder.Property(g => g.BatchNo).IsRequired().HasMaxLength(50);
        builder.Property(g => g.BatchName).IsRequired().HasMaxLength(200);
        builder.Property(g => g.LeaderName).IsRequired().HasMaxLength(100);
        builder.Property(g => g.LeaderPhone).HasMaxLength(20);
        builder.HasIndex(g => g.BatchNo).IsUnique();
        builder.HasOne(g => g.LeaderTier)
            .WithMany(l => l.GroupBatches)
            .HasForeignKey(g => g.LeaderTierId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(g => g.ArrivalLists)
            .WithOne(a => a.GroupBatch)
            .HasForeignKey(a => a.GroupBatchId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(g => g.ExceptionOrders)
            .WithOne(e => e.GroupBatch)
            .HasForeignKey(e => e.GroupBatchId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
