using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;

namespace ElderCareScheduling.API.Services;

public interface IScheduleService
{
    Task<PagedResultDto<ScheduleListDto>> GetListAsync(ScheduleQueryDto query);
    Task<ScheduleDetailDto?> GetByIdAsync(Guid id);
    Task<ScheduleDetailDto> CreateAsync(CreateScheduleDto dto);
    Task<ScheduleDetailDto> UpdateAsync(Guid id, UpdateScheduleDto dto);
    Task<bool> DeleteAsync(Guid id);
    Task<ScheduleDetailDto> SubmitForReviewAsync(Guid id, string operatorName);
    Task<ScheduleDetailDto> ApproveReviewAsync(Guid id, ScheduleStatusChangeDto dto);
    Task<ScheduleDetailDto> RejectReviewAsync(Guid id, ScheduleStatusChangeDto dto);
    Task<ScheduleDetailDto> StartProcessingAsync(Guid id, string operatorName);
    Task<ScheduleDetailDto> CompleteProcessingAsync(Guid id, ScheduleStatusChangeDto dto);
    Task<ScheduleDetailDto> SubmitPostReviewAsync(Guid id, string operatorName);
    Task<ScheduleDetailDto> CompletePostReviewAsync(Guid id, ScheduleStatusChangeDto dto);
    Task<ScheduleDetailDto> CloseScheduleAsync(Guid id, string operatorName);
    Task<ScheduleDetailDto> ChangeStatusAsync(Guid id, ScheduleStatusChangeDto dto);
    Task AddReviewRecordAsync(Guid id, ReviewRecord reviewRecord);
}
