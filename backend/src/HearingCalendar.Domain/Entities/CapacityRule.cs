using HearingCalendar.Domain.Common;

namespace HearingCalendar.Domain.Entities;

public class CapacityRule : BaseEntity
{
    public required string CourtRoom { get; set; }
    public int MaxHearingsPerSlot { get; set; }
    public int MaxParticipantsPerHearing { get; set; }
    public bool IsActive { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
}
