using ColdChainScheduler.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ColdChainScheduler.Infrastructure.Data.Configurations;

public class ProductTagConfiguration : IEntityTypeConfiguration<ProductTag>
{
    public void Configure(EntityTypeBuilder<ProductTag> builder)
    {
        builder.ToTable("ProductTags");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.TagCode).IsRequired().HasMaxLength(50);
        builder.Property(p => p.ProductName).IsRequired().HasMaxLength(200);
        builder.Property(p => p.Category).HasMaxLength(100);
        builder.Property(p => p.StorageTempMin).HasColumnType("decimal(18,2)");
        builder.Property(p => p.StorageTempMax).HasColumnType("decimal(18,2)");
        builder.Property(p => p.Unit).HasMaxLength(20);
        builder.Property(p => p.UnitPrice).HasColumnType("decimal(18,2)");
        builder.HasIndex(p => p.TagCode).IsUnique();
    }
}
