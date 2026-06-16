using ElderCareScheduling.API.Models.Entities;

namespace ElderCareScheduling.API.Repositories;

public interface IReviewRecordRepository : IBaseRepository<ReviewRecord>
{
    Task<IEnumerable<ReviewRecord>> GetByScheduleIdAsync(Guid scheduleId);
    Task<IEnumerable<ReviewRecord>> GetByExceptionIdAsync(Guid exceptionId);
}
