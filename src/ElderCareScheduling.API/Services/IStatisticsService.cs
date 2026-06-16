using ElderCareScheduling.API.Models.DTOs;

namespace ElderCareScheduling.API.Services;

public interface IStatisticsService
{
    Task<StatisticsDto> GetOverviewStatisticsAsync(StatisticsQueryDto query);
}
