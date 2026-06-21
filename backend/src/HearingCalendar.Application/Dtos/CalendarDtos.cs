namespace HearingCalendar.Application.Dtos;

public record CalendarSlotResponse(
    Guid Id,
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string CourtRoom,
    int MaxCapacity,
    int CurrentCount);

public record CreateCalendarSlotRequest(
    DateOnly Date,
    TimeOnly StartTime,
    TimeOnly EndTime,
    string CourtRoom,
    int MaxCapacity);

public record CapacityRuleResponse(
    Guid Id,
    string CourtRoom,
    int MaxHearingsPerSlot,
    int MaxParticipantsPerHearing,
    bool IsActive,
    DateOnly EffectiveFrom,
    DateOnly? EffectiveTo);

public record CreateCapacityRuleRequest(
    string CourtRoom,
    int MaxHearingsPerSlot,
    int MaxParticipantsPerHearing,
    DateOnly EffectiveFrom,
    DateOnly? EffectiveTo);
