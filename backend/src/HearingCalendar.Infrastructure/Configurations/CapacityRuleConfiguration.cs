using HearingCalendar.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HearingCalendar.Infrastructure.Configurations;

public class CapacityRuleConfiguration : IEntityTypeConfiguration<CapacityRule>
{
    public void Configure(EntityTypeBuilder<CapacityRule> builder)
    {
        builder.HasIndex(e => new { e.CourtRoom, e.EffectiveFrom });
    }
}
