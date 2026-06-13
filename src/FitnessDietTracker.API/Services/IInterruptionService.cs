using FitnessDietTracker.API.Dtos;

namespace FitnessDietTracker.API.Services;

public interface IInterruptionService
{
    Task<List<CheckInInterruptionDto>> GetAllAsync(int? coachId, int? userId);
    Task<CheckInInterruptionDto?> GetByIdAsync(int id);
    Task<CheckInInterruptionDto> HandleAsync(int id, HandleInterruptionDto dto);
}
