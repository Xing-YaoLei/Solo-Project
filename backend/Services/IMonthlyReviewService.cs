using CertSchedulePlatform.DTOs;

namespace CertSchedulePlatform.Services;

public interface IMonthlyReviewService
{
    Task<MonthlyReviewDto> GetMonthlyReviewAsync(MonthlyReviewQueryDto query);
    Task<List<CourseReviewDto>> GetCourseReviewsAsync(int year, int month, int certificateId);
}
