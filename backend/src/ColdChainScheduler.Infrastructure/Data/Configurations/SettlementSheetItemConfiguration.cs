using ColdChainScheduler.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ColdChainScheduler.Infrastructure.Data.Configurations;

public class SettlementSheetItemConfiguration : IEntityTypeConfiguration<SettlementSheetItem>
{
    public void Configure(EntityTypeBuilder<SettlementSheetItem> builder)
    {
        builder.ToTable("SettlementSheetItems");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
        builder.Property(i => i.Subtotal).HasColumnType("decimal(18,2)");
        builder.Property(i => i.CaliberNote).HasMaxLength(500);
        builder.HasOne(i => i.ProductTag)
            .WithMany()
            .HasForeignKey(i => i.ProductTagId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
