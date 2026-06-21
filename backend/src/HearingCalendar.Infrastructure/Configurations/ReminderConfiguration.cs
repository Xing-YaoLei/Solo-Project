using HearingCalendar.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HearingCalendar.Infrastructure.Configurations;

public class ReminderConfiguration : IEntityTypeConfiguration<Reminder>
{
    public void Configure(EntityTypeBuilder<Reminder> builder)
    {
        builder.HasIndex(e => new { e.Status, e.RemindAt });

        builder.HasOne(e => e.Hearing)
            .WithMany(e => e.Reminders)
            .HasForeignKey(e => e.HearingId);
    }
}
