using ColdChainScheduler.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ColdChainScheduler.Infrastructure.Data.Configurations;

public class StatusChangeLogConfiguration : IEntityTypeConfiguration<StatusChangeLog>
{
    public void Configure(EntityTypeBuilder<StatusChangeLog> builder)
    {
        builder.ToTable("StatusChangeLogs");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.EntityType).IsRequired().HasMaxLength(50);
        builder.Property(s => s.OldStatus).HasMaxLength(50);
        builder.Property(s => s.NewStatus).IsRequired().HasMaxLength(50);
        builder.Property(s => s.ChangedBy).HasMaxLength(100);
        builder.Property(s => s.Reason).HasMaxLength(500);
        builder.HasIndex(s => new { s.EntityType, s.EntityId });
    }
}
