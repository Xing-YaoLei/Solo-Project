using FitnessDietTracker.API.Dtos;

namespace FitnessDietTracker.API.Services;

public interface IBodyMeasurementService
{
    Task<List<BodyMeasurementDto>> GetByUserAsync(int userId, DateTime? startDate, DateTime? endDate);
    Task<BodyMeasurementDto?> GetByIdAsync(int id);
    Task<BodyMeasurementDto> CreateAsync(BodyMeasurementCreateDto dto);
    Task<BodyMeasurementDto?> UpdateAsync(int id, BodyMeasurementUpdateDto dto);
    Task<bool> DeleteAsync(int id);
}
