using ColdChainScheduler.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ColdChainScheduler.Infrastructure.Data.Configurations;

public class ArrivalListItemConfiguration : IEntityTypeConfiguration<ArrivalListItem>
{
    public void Configure(EntityTypeBuilder<ArrivalListItem> builder)
    {
        builder.ToTable("ArrivalListItems");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Temperature).HasColumnType("decimal(18,2)");
        builder.Property(i => i.Condition).HasMaxLength(200);
        builder.HasOne(i => i.ProductTag)
            .WithMany()
            .HasForeignKey(i => i.ProductTagId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
