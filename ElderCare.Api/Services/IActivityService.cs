using ElderCare.Api.DTOs;

namespace ElderCare.Api.Services;

public interface IActivityService
{
    Task<IEnumerable<ThresholdDto>> GetAllThresholdsAsync();
    Task<ThresholdDto> CreateThresholdAsync(CreateThresholdDto dto);
    Task<ThresholdDto?> UpdateThresholdAsync(int id, CreateThresholdDto dto);
    Task<IEnumerable<CheckInDto>> GetAllCheckInsAsync();
    Task<CheckInDto> CreateCheckInAsync(CreateCheckInDto dto);
    Task<IEnumerable<CheckInStatsDto>> GetCheckInStatsAsync(int? elderlyId = null, int? staffId = null);
    Task<IEnumerable<CheckInStatsDto>> CheckThresholdComplianceAsync(int? areaId = null);
}
