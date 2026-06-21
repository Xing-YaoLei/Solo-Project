using HearingCalendar.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HearingCalendar.Infrastructure.Configurations;

public class ClientFeedbackConfiguration : IEntityTypeConfiguration<ClientFeedback>
{
    public void Configure(EntityTypeBuilder<ClientFeedback> builder)
    {
        builder.HasIndex(e => new { e.HearingId, e.ClientId }).IsUnique();

        builder.HasOne(e => e.Hearing)
            .WithMany()
            .HasForeignKey(e => e.HearingId);

        builder.HasOne(e => e.Client)
            .WithMany()
            .HasForeignKey(e => e.ClientId);
    }
}
