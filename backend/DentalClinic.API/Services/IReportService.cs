using DentalClinic.API.DTOs;

namespace DentalClinic.API.Services;

public interface IReportService
{
    Task<DashboardStatsDto> GetDashboardStatsAsync();
    Task<IEnumerable<AppointmentRateDto>> GetAppointmentRatesAsync(DateTime startDate, DateTime endDate);
    Task<IEnumerable<ReAppointmentTrendDto>> GetReAppointmentTrendAsync(int months = 6);
    Task<IEnumerable<NoShowAppointmentDto>> GetHighRiskNoShowsAsync(int topN = 10);
}
