using ElderCareScheduling.API.Models.DTOs;

namespace ElderCareScheduling.API.Services;

public interface IExceptionRecordService
{
    Task<PagedResultDto<ExceptionRecordListDto>> GetListAsync(ExceptionQueryDto query);
    Task<ExceptionRecordDetailDto?> GetByIdAsync(Guid id);
    Task<ExceptionRecordDetailDto> CreateAsync(CreateExceptionRecordDto dto);
    Task<ExceptionRecordDetailDto> UpdateAsync(Guid id, UpdateExceptionRecordDto dto);
    Task<ExceptionRecordDetailDto> AssignHandlerAsync(Guid id, ExceptionStatusChangeDto dto);
    Task<ExceptionRecordDetailDto> StartInvestigationAsync(Guid id, ExceptionStatusChangeDto dto);
    Task<ExceptionRecordDetailDto> StartHandlingAsync(Guid id, ExceptionStatusChangeDto dto);
    Task<ExceptionRecordDetailDto> ResolveAsync(Guid id, ExceptionStatusChangeDto dto);
    Task<ExceptionRecordDetailDto> RequestSupplementAsync(Guid id, ExceptionStatusChangeDto dto);
    Task<ExceptionRecordDetailDto> SubmitSupplementAsync(Guid id, ExceptionStatusChangeDto dto);
    Task<ExceptionRecordDetailDto> EscalateAsync(Guid id, ExceptionStatusChangeDto dto);
    Task<ExceptionRecordDetailDto> CloseNormalAsync(Guid id, ExceptionStatusChangeDto dto);
    Task<ExceptionRecordDetailDto> CloseWithSupplementAsync(Guid id, ExceptionStatusChangeDto dto);
    Task<ExceptionRecordDetailDto> CloseEscalatedAsync(Guid id, ExceptionStatusChangeDto dto);
    Task<ExceptionAttachmentDto> AddAttachmentAsync(Guid exceptionId, ExceptionAttachmentDto dto);
}
