using HearingCalendar.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HearingCalendar.Infrastructure.Configurations;

public class HearingAttachmentConfiguration : IEntityTypeConfiguration<HearingAttachment>
{
    public void Configure(EntityTypeBuilder<HearingAttachment> builder)
    {
        builder.HasOne(e => e.Hearing)
            .WithMany(e => e.Attachments)
            .HasForeignKey(e => e.HearingId);
    }
}
