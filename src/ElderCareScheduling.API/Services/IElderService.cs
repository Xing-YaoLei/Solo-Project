using ElderCareScheduling.API.Models.DTOs;

namespace ElderCareScheduling.API.Services;

public interface IElderService
{
    Task<PagedResultDto<ElderListDto>> GetListAsync(ElderQueryDto query);
    Task<ElderDetailDto?> GetByIdAsync(Guid id);
    Task<ElderDetailDto> CreateAsync(CreateElderDto dto);
    Task<ElderDetailDto> UpdateAsync(Guid id, UpdateElderDto dto);
    Task<bool> DeleteAsync(Guid id);
}
