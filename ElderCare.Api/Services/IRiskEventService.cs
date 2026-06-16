using ElderCare.Api.DTOs;

namespace ElderCare.Api.Services;

public interface IRiskEventService
{
    Task<IEnumerable<RiskEventDto>> GetAllRiskEventsAsync();
    Task<RiskEventDto?> GetRiskEventByIdAsync(int id);
    Task<RiskEventDto> CreateRiskEventAsync(CreateRiskEventDto dto);
    Task<RiskEventDto?> UpdateRiskEventAsync(int id, UpdateRiskEventDto dto);
    Task<ReminderActionDto> PushReminderAsync(int riskEventId, CreateReminderActionDto dto);
    Task<ReminderActionDto> SupplementReminderAsync(int riskEventId, CreateReminderActionDto dto);
    Task<ReminderActionDto> RetryReminderAsync(int riskEventId, int reminderId, CreateReminderActionDto dto);
    Task<ReminderActionDto> CloseReminderAsync(int riskEventId, int reminderId, CreateReminderActionDto dto);
    Task<IEnumerable<ReminderActionDto>> GetReminderHistoryAsync(int riskEventId);
    Task<RiskEventTimelineDto> GetRiskEventTimelineAsync(int riskEventId);
}
