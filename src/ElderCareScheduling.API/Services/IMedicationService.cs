using ElderCareScheduling.API.Models.DTOs;

namespace ElderCareScheduling.API.Services;

public interface IMedicationService
{
    Task<List<MedicationDto>> GetByElderIdAsync(Guid elderId);
    Task<MedicationDto> CreateAsync(CreateMedicationDto dto);
    Task<bool> DeleteAsync(Guid id);
}
