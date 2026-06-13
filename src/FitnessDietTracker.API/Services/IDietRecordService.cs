using FitnessDietTracker.API.Dtos;

namespace FitnessDietTracker.API.Services;

public interface IDietRecordService
{
    Task<List<DietRecordDto>> GetRecordsByUserAsync(int userId, DateTime? startDate, DateTime? endDate);
    Task<DietRecordDto?> GetByIdAsync(int id);
    Task<DietRecordDto> CreateAsync(DietRecordCreateDto dto);
    Task<DietRecordDto?> UpdateAsync(int id, DietRecordUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<List<DietRecordDto>> GetRecordsWithDetailsAsync(int userId, DateTime? startDate, DateTime? endDate);
}
