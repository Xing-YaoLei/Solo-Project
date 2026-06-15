using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.Services;

public interface IProgressAlertService
{
    Task<PagedResult<ProgressAlertDto>> GetAlertsAsync(AlertQueryDto query);
    Task<ProgressAlertDto?> GetByIdAsync(int id);
    Task<List<ProgressAlertDto>> GetActiveAlertsByUserAsync(int userId);
    Task<ProgressAlertDto?> HandleAlertAsync(int id, AlertHandleDto dto);
    Task<int> CheckAndCreateAlertsAsync();
    Task<int> GetOpenAlertCountAsync(int? userId = null);
}
