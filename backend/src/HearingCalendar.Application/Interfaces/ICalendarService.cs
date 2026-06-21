using HearingCalendar.Application.Dtos;

namespace HearingCalendar.Application.Interfaces;

public interface ICalendarService
{
    Task<CalendarSlotResponse> CreateSlotAsync(CreateCalendarSlotRequest request);
    Task<IEnumerable<CalendarSlotResponse>> GetSlotsByDateRangeAsync(DateOnly from, DateOnly to, string? courtRoom = null);
    Task<CapacityRuleResponse> CreateCapacityRuleAsync(CreateCapacityRuleRequest request);
    Task<IEnumerable<CapacityRuleResponse>> GetActiveCapacityRulesAsync();
    Task<bool> ValidateCapacityAsync(DateOnly date, string courtRoom);
}
