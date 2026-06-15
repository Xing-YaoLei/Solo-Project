using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.Services;

public interface ICertificateService
{
    Task<List<CertificateDto>> GetAllAsync(bool? isActive = null);
    Task<CertificateDto?> GetByIdAsync(int id);
    Task<CertificateDto> CreateAsync(CertificateCreateDto dto);
    Task<CertificateDto?> UpdateAsync(int id, CertificateUpdateDto dto);
    Task<bool> DeleteAsync(int id);
}
