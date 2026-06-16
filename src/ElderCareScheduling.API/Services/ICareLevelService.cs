using ElderCareScheduling.API.Models.DTOs;

namespace ElderCareScheduling.API.Services;

public interface ICareLevelService
{
    Task<List<CareLevelDto>> GetAllAsync();
    Task<CareLevelDto?> GetByIdAsync(Guid id);
}
