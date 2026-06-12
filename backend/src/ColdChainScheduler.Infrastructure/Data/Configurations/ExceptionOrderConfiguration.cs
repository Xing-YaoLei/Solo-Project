using ColdChainScheduler.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ColdChainScheduler.Infrastructure.Data.Configurations;

public class ExceptionOrderConfiguration : IEntityTypeConfiguration<ExceptionOrder>
{
    public void Configure(EntityTypeBuilder<ExceptionOrder> builder)
    {
        builder.ToTable("ExceptionOrders");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.OrderNo).IsRequired().HasMaxLength(50);
        builder.Property(e => e.CustomerName).HasMaxLength(100);
        builder.Property(e => e.CustomerPhone).HasMaxLength(20);
        builder.Property(e => e.ImpactDescription).HasMaxLength(1000);
        builder.Property(e => e.Responsibility).HasMaxLength(500);
        builder.Property(e => e.ResolutionNotes).HasMaxLength(1000);
        builder.Property(e => e.ResolvedBy).HasMaxLength(100);
        builder.HasIndex(e => e.OrderNo).IsUnique();
        builder.HasOne(e => e.ArrivalList)
            .WithMany()
            .HasForeignKey(e => e.ArrivalListId)
            .OnDelete(DeleteBehavior.SetNull);
        builder.HasOne(e => e.ProductTag)
            .WithMany()
            .HasForeignKey(e => e.ProductTagId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
