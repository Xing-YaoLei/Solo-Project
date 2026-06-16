using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;

namespace ElderCareScheduling.API.Repositories;

public interface IExceptionRecordRepository : IBaseRepository<ExceptionRecord>
{
    Task<ExceptionRecord?> GetWithFullDetailsAsync(Guid id);
    Task<PagedResultDto<ExceptionRecordListDto>> GetPagedListAsync(ExceptionQueryDto query);
    Task<IEnumerable<ExceptionRecord>> GetByScheduleIdAsync(Guid scheduleId);
    Task<IEnumerable<ExceptionRecord>> GetByElderIdAsync(Guid elderId);
    Task<string> GenerateExceptionNoAsync();
    Task AddStatusHistoryAsync(ExceptionStatusHistory history);
    Task AddAttachmentAsync(ExceptionAttachment attachment);
}
