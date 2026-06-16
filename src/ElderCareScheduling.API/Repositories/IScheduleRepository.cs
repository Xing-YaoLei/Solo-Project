using ElderCareScheduling.API.Enums;
using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;

namespace ElderCareScheduling.API.Repositories;

public interface IScheduleRepository : IBaseRepository<CareSchedule>
{
    Task<CareSchedule?> GetWithFullDetailsAsync(Guid id);
    Task<PagedResultDto<ScheduleListDto>> GetPagedListAsync(ScheduleQueryDto query);
    Task<IEnumerable<CareSchedule>> GetByElderIdAsync(Guid elderId);
    Task<IEnumerable<CareSchedule>> GetByBedIdAsync(Guid bedId, bool includeClosed = false);
    Task<IEnumerable<CareSchedule>> GetByStatusAsync(ScheduleStatus status);
    Task<string> GenerateScheduleNoAsync();
}
