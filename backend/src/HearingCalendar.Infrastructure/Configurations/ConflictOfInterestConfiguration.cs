using HearingCalendar.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HearingCalendar.Infrastructure.Configurations;

public class ConflictOfInterestConfiguration : IEntityTypeConfiguration<ConflictOfInterest>
{
    public void Configure(EntityTypeBuilder<ConflictOfInterest> builder)
    {
        builder.HasIndex(e => e.ResolutionStatus);

        builder.HasOne(e => e.Hearing)
            .WithOne(e => e.Conflict)
            .HasForeignKey<ConflictOfInterest>(e => e.HearingId);

        builder.HasOne(e => e.RelatedAttachment)
            .WithMany()
            .HasForeignKey(e => e.RelatedAttachmentId);
    }
}
