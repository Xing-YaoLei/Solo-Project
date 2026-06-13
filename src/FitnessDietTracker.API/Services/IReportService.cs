using FitnessDietTracker.API.Dtos;

namespace FitnessDietTracker.API.Services;

public interface IReportService
{
    Task<MonthlyReviewDto> GetMonthlyReviewAsync(int userId, int year, int month);
}
