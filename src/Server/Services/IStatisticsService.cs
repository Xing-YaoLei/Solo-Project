using SiteSchedule.Dtos.Statistics;

namespace SiteSchedule.Services;

public interface IStatisticsService
{
    Task<StatisticsOverviewDto> GetOverviewAsync();
    Task<List<MaterialCompleteRateDto>> GetMaterialCompleteRatesAsync(ReviewQueryDto query);
    Task<List<AreaStatisticsDto>> GetAreaStatisticsAsync(ReviewQueryDto query);
    Task<List<PersonStatisticsDto>> GetPersonStatisticsAsync(ReviewQueryDto query);
    Task<List<MaterialStatisticsDto>> GetMaterialStatisticsAsync(ReviewQueryDto query);
}
