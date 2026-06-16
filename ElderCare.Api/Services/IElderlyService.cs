using ElderCare.Api.DTOs;

namespace ElderCare.Api.Services;

public interface IElderlyService
{
    Task<IEnumerable<ElderlyDto>> GetAllAsync();
    Task<ElderlyDto?> GetByIdAsync(int id);
    Task<ElderlyDto> CreateAsync(CreateElderlyDto dto);
    Task<ElderlyDto?> UpdateAsync(int id, UpdateElderlyDto dto);
}
