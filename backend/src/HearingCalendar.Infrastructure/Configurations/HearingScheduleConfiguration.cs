using HearingCalendar.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HearingCalendar.Infrastructure.Configurations;

public class HearingScheduleConfiguration : IEntityTypeConfiguration<HearingSchedule>
{
    public void Configure(EntityTypeBuilder<HearingSchedule> builder)
    {
        builder.Property(e => e.CaseNumber).IsRequired().HasMaxLength(50);
        builder.HasIndex(e => e.CaseNumber).IsUnique();

        builder.Property(e => e.CaseName).IsRequired().HasMaxLength(200);
        builder.Property(e => e.CourtName).IsRequired().HasMaxLength(100);
        builder.Property(e => e.CourtRoom).IsRequired().HasMaxLength(50);

        builder.HasIndex(e => e.HearingDate);
        builder.HasIndex(e => e.Status);
        builder.HasIndex(e => e.IsConflictFlagged);

        builder.HasOne(e => e.Conflict)
            .WithOne(e => e.Hearing)
            .HasForeignKey<ConflictOfInterest>(e => e.HearingId);

        builder.HasMany(e => e.Participants)
            .WithOne(e => e.Hearing)
            .HasForeignKey(e => e.HearingId);

        builder.HasMany(e => e.Attachments)
            .WithOne(e => e.Hearing)
            .HasForeignKey(e => e.HearingId);

        builder.HasMany(e => e.StatusLogs)
            .WithOne(e => e.Hearing)
            .HasForeignKey(e => e.HearingId);

        builder.HasMany(e => e.Reminders)
            .WithOne(e => e.Hearing)
            .HasForeignKey(e => e.HearingId);
    }
}
