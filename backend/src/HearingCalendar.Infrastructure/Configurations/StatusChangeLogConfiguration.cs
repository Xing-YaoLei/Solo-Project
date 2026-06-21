using HearingCalendar.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HearingCalendar.Infrastructure.Configurations;

public class StatusChangeLogConfiguration : IEntityTypeConfiguration<StatusChangeLog>
{
    public void Configure(EntityTypeBuilder<StatusChangeLog> builder)
    {
        builder.HasIndex(e => e.HearingId);

        builder.HasOne(e => e.Hearing)
            .WithMany(e => e.StatusLogs)
            .HasForeignKey(e => e.HearingId);

        builder.HasOne(e => e.RelatedAttachment)
            .WithMany()
            .HasForeignKey(e => e.RelatedAttachmentId);
    }
}
