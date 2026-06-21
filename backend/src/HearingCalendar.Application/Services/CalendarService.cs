using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Entities;
using HearingCalendar.Domain.Enums;
using HearingCalendar.Infrastructure.Repositories;

namespace HearingCalendar.Application.Services;

public class CalendarService : ICalendarService
{
    private readonly IRepository<CalendarSlot> _slotRepo;
    private readonly IRepository<CapacityRule> _ruleRepo;
    private readonly IRepository<HearingSchedule> _hearingRepo;

    public CalendarService(
        IRepository<CalendarSlot> slotRepo,
        IRepository<CapacityRule> ruleRepo,
        IRepository<HearingSchedule> hearingRepo)
    {
        _slotRepo = slotRepo;
        _ruleRepo = ruleRepo;
        _hearingRepo = hearingRepo;
    }

    public async Task<CalendarSlotResponse> CreateSlotAsync(CreateCalendarSlotRequest request)
    {
        var slot = new CalendarSlot
        {
            Date = request.Date,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            CourtRoom = request.CourtRoom,
            MaxCapacity = request.MaxCapacity,
            CurrentCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _slotRepo.AddAsync(slot);
        return MapSlotToResponse(created);
    }

    public async Task<IEnumerable<CalendarSlotResponse>> GetSlotsByDateRangeAsync(DateOnly from, DateOnly to, string? courtRoom = null)
    {
        var slots = await _slotRepo.FindAsync(s =>
            s.Date >= from && s.Date <= to &&
            (courtRoom == null || s.CourtRoom == courtRoom));

        return slots.Select(MapSlotToResponse);
    }

    public async Task<CapacityRuleResponse> CreateCapacityRuleAsync(CreateCapacityRuleRequest request)
    {
        var rule = new CapacityRule
        {
            CourtRoom = request.CourtRoom,
            MaxHearingsPerSlot = request.MaxHearingsPerSlot,
            MaxParticipantsPerHearing = request.MaxParticipantsPerHearing,
            IsActive = true,
            EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _ruleRepo.AddAsync(rule);
        return MapRuleToResponse(created);
    }

    public async Task<IEnumerable<CapacityRuleResponse>> GetActiveCapacityRulesAsync()
    {
        var rules = await _ruleRepo.FindAsync(r => r.IsActive);
        return rules.Select(MapRuleToResponse);
    }

    public async Task<bool> ValidateCapacityAsync(DateOnly date, string courtRoom)
    {
        var rules = await _ruleRepo.FindAsync(r =>
            r.CourtRoom == courtRoom && r.IsActive &&
            r.EffectiveFrom <= date &&
            (r.EffectiveTo == null || r.EffectiveTo >= date));

        var rule = rules.FirstOrDefault();
        if (rule is null) return true;

        var hearings = await _hearingRepo.FindAsync(h =>
            h.HearingDate == date && h.CourtRoom == courtRoom && h.Status != HearingStatus.Cancelled);

        return hearings.Count() < rule.MaxHearingsPerSlot;
    }

    private static CalendarSlotResponse MapSlotToResponse(CalendarSlot s)
    {
        return new CalendarSlotResponse(s.Id, s.Date, s.StartTime, s.EndTime, s.CourtRoom, s.MaxCapacity, s.CurrentCount);
    }

    private static CapacityRuleResponse MapRuleToResponse(CapacityRule r)
    {
        return new CapacityRuleResponse(r.Id, r.CourtRoom, r.MaxHearingsPerSlot, r.MaxParticipantsPerHearing, r.IsActive, r.EffectiveFrom, r.EffectiveTo);
    }
}
