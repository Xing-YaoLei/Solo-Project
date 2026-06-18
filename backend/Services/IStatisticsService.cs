using CarServiceAppointment.API.DTOs;

namespace CarServiceAppointment.API.Services;

public interface IStatisticsService
{
    Task<StatisticsDto> GetOverviewAsync();
    Task<StatisticsOverviewDto> GetOverviewAsync(DateTime? startDate, DateTime? endDate);
    Task<List<SourceDistributionDto>> GetSourceDistributionAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<List<PersonPerformanceDto>> GetPersonPerformanceAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<List<ConclusionDistributionDto>> GetConclusionDistributionAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<decimal> GetRepairReturnRateAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task<List<MonthlyStatisticsDto>> GetMonthlyStatisticsAsync(int year);
}
