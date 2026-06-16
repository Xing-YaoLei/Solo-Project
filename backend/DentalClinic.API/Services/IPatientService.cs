using DentalClinic.API.DTOs;

namespace DentalClinic.API.Services;

public interface IPatientService
{
    Task<IEnumerable<PatientSummaryDto>> GetPatientsAsync(string? search = null, int page = 1, int pageSize = 20);
    Task<PatientDto?> GetPatientByIdAsync(int id);
    Task<PatientDto> CreatePatientAsync(CreatePatientDto dto);
    Task<PatientDto?> UpdatePatientAsync(int id, UpdatePatientDto dto);
    Task<bool> DeletePatientAsync(int id);
    Task<PatientSummaryDto?> GetPatientSummaryAsync(int id);
    Task<int> GetPatientCountAsync(string? search = null);
}
