using HearingCalendar.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HearingCalendar.Infrastructure.Configurations;

public class HearingParticipantConfiguration : IEntityTypeConfiguration<HearingParticipant>
{
    public void Configure(EntityTypeBuilder<HearingParticipant> builder)
    {
        builder.HasIndex(e => new { e.HearingId, e.UserId }).IsUnique();

        builder.HasOne(e => e.Hearing)
            .WithMany(e => e.Participants)
            .HasForeignKey(e => e.HearingId);

        builder.HasOne(e => e.User)
            .WithMany()
            .HasForeignKey(e => e.UserId);
    }
}
