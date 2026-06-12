using ColdChainScheduler.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ColdChainScheduler.Infrastructure.Data.Configurations;

public class ArrivalListConfiguration : IEntityTypeConfiguration<ArrivalList>
{
    public void Configure(EntityTypeBuilder<ArrivalList> builder)
    {
        builder.ToTable("ArrivalLists");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.ListNo).IsRequired().HasMaxLength(50);
        builder.Property(a => a.Receiver).HasMaxLength(100);
        builder.HasIndex(a => a.ListNo).IsUnique();
        builder.HasMany(a => a.Items)
            .WithOne(i => i.ArrivalList)
            .HasForeignKey(i => i.ArrivalListId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
