using ElderCareScheduling.API.Models.DTOs;

namespace ElderCareScheduling.API.Services;

public interface IBedService
{
    Task<List<BedDto>> GetAllAsync();
    Task<List<BedDto>> GetAvailableAsync();
    Task<BedDto?> GetByIdAsync(Guid id);
}
