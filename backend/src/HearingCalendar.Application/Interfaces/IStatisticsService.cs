using HearingCalendar.Application.Dtos;

namespace HearingCalendar.Application.Interfaces;

public interface IStatisticsService
{
    Task<StatisticsOverviewResponse> GetOverviewAsync(DateOnly? from = null, DateOnly? to = null, Guid? callerUserId = null);
    Task<IEnumerable<ClientSatisfactionReport>> GetClientSatisfactionAsync(DateOnly? from = null, DateOnly? to = null, Guid? callerUserId = null);
    Task<IEnumerable<HearingStatistics>> GetHearingStatisticsAsync(DateOnly from, DateOnly to, Guid? callerUserId = null);
    Task<ClientSatisfactionReport> GetClientSatisfactionDetailAsync(Guid clientId, Guid? callerUserId = null);
}
