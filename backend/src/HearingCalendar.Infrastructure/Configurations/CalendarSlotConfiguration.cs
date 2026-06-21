using HearingCalendar.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HearingCalendar.Infrastructure.Configurations;

public class CalendarSlotConfiguration : IEntityTypeConfiguration<CalendarSlot>
{
    public void Configure(EntityTypeBuilder<CalendarSlot> builder)
    {
        builder.HasIndex(e => new { e.Date, e.CourtRoom, e.StartTime }).IsUnique();
    }
}
