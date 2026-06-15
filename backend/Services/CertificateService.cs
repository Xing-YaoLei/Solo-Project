using Microsoft.EntityFrameworkCore;
using CertSchedulePlatform.Data;
using CertSchedulePlatform.DTOs;
using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.Services;

public class CertificateService : ICertificateService
{
    private readonly AppDbContext _context;

    public CertificateService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CertificateDto>> GetAllAsync(bool? isActive = null)
    {
        var query = _context.Certificates.AsQueryable();

        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        return await query
            .OrderBy(c => c.Id)
            .Select(c => new CertificateDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Code = c.Code,
                ExamDate = c.ExamDate,
                RegistrationStart = c.RegistrationStart,
                RegistrationEnd = c.RegistrationEnd,
                IsActive = c.IsActive
            })
            .ToListAsync();
    }

    public async Task<CertificateDto?> GetByIdAsync(int id)
    {
        var certificate = await _context.Certificates.FindAsync(id);
        if (certificate == null) return null;

        return new CertificateDto
        {
            Id = certificate.Id,
            Name = certificate.Name,
            Description = certificate.Description,
            Code = certificate.Code,
            ExamDate = certificate.ExamDate,
            RegistrationStart = certificate.RegistrationStart,
            RegistrationEnd = certificate.RegistrationEnd,
            IsActive = certificate.IsActive
        };
    }

    public async Task<CertificateDto> CreateAsync(CertificateCreateDto dto)
    {
        var certificate = new Certificate
        {
            Name = dto.Name,
            Description = dto.Description,
            Code = dto.Code,
            ExamDate = dto.ExamDate,
            RegistrationStart = dto.RegistrationStart,
            RegistrationEnd = dto.RegistrationEnd,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Certificates.Add(certificate);
        await _context.SaveChangesAsync();

        return new CertificateDto
        {
            Id = certificate.Id,
            Name = certificate.Name,
            Description = certificate.Description,
            Code = certificate.Code,
            ExamDate = certificate.ExamDate,
            RegistrationStart = certificate.RegistrationStart,
            RegistrationEnd = certificate.RegistrationEnd,
            IsActive = certificate.IsActive
        };
    }

    public async Task<CertificateDto?> UpdateAsync(int id, CertificateUpdateDto dto)
    {
        var certificate = await _context.Certificates.FindAsync(id);
        if (certificate == null) return null;

        certificate.Name = dto.Name;
        certificate.Description = dto.Description;
        certificate.Code = dto.Code;
        certificate.ExamDate = dto.ExamDate;
        certificate.RegistrationStart = dto.RegistrationStart;
        certificate.RegistrationEnd = dto.RegistrationEnd;
        certificate.IsActive = dto.IsActive;
        certificate.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new CertificateDto
        {
            Id = certificate.Id,
            Name = certificate.Name,
            Description = certificate.Description,
            Code = certificate.Code,
            ExamDate = certificate.ExamDate,
            RegistrationStart = certificate.RegistrationStart,
            RegistrationEnd = certificate.RegistrationEnd,
            IsActive = certificate.IsActive
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var certificate = await _context.Certificates.FindAsync(id);
        if (certificate == null) return false;

        certificate.IsActive = false;
        certificate.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }
}
