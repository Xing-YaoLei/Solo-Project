using ElderCare.Api.Data;
using ElderCare.Api.DTOs;
using ElderCare.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ElderCare.Api.Services;

public class ElderlyService : IElderlyService
{
    private readonly AppDbContext _context;

    public ElderlyService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<ElderlyDto>> GetAllAsync()
    {
        return await _context.ElderlyProfiles
            .Include(e => e.Area)
            .Include(e => e.PrimaryStaff)
            .Select(e => new ElderlyDto
            {
                Id = e.Id,
                Name = e.Name,
                Gender = e.Gender,
                BirthDate = e.BirthDate,
                RoomNumber = e.RoomNumber,
                AreaId = e.AreaId,
                AreaName = e.Area.Name,
                PrimaryStaffId = e.PrimaryStaffId,
                PrimaryStaffName = e.PrimaryStaff.Name,
                HealthConditions = e.HealthConditions,
                EmergencyContact = e.EmergencyContact,
                EmergencyPhone = e.EmergencyPhone,
                AdmissionDate = e.AdmissionDate,
                Status = e.Status
            })
            .ToListAsync();
    }

    public async Task<ElderlyDto?> GetByIdAsync(int id)
    {
        return await _context.ElderlyProfiles
            .Include(e => e.Area)
            .Include(e => e.PrimaryStaff)
            .Where(e => e.Id == id)
            .Select(e => new ElderlyDto
            {
                Id = e.Id,
                Name = e.Name,
                Gender = e.Gender,
                BirthDate = e.BirthDate,
                RoomNumber = e.RoomNumber,
                AreaId = e.AreaId,
                AreaName = e.Area.Name,
                PrimaryStaffId = e.PrimaryStaffId,
                PrimaryStaffName = e.PrimaryStaff.Name,
                HealthConditions = e.HealthConditions,
                EmergencyContact = e.EmergencyContact,
                EmergencyPhone = e.EmergencyPhone,
                AdmissionDate = e.AdmissionDate,
                Status = e.Status
            })
            .FirstOrDefaultAsync();
    }

    public async Task<ElderlyDto> CreateAsync(CreateElderlyDto dto)
    {
        var entity = new ElderlyProfile
        {
            Name = dto.Name,
            Gender = dto.Gender,
            BirthDate = dto.BirthDate,
            RoomNumber = dto.RoomNumber,
            AreaId = dto.AreaId,
            PrimaryStaffId = dto.PrimaryStaffId,
            HealthConditions = dto.HealthConditions,
            EmergencyContact = dto.EmergencyContact,
            EmergencyPhone = dto.EmergencyPhone,
            AdmissionDate = dto.AdmissionDate,
            Status = dto.Status
        };
        _context.ElderlyProfiles.Add(entity);
        await _context.SaveChangesAsync();
        return await GetByIdAsync(entity.Id) ?? throw new InvalidOperationException();
    }

    public async Task<ElderlyDto?> UpdateAsync(int id, UpdateElderlyDto dto)
    {
        var entity = await _context.ElderlyProfiles.FindAsync(id);
        if (entity == null) return null;
        entity.Name = dto.Name;
        entity.Gender = dto.Gender;
        entity.BirthDate = dto.BirthDate;
        entity.RoomNumber = dto.RoomNumber;
        entity.AreaId = dto.AreaId;
        entity.PrimaryStaffId = dto.PrimaryStaffId;
        entity.HealthConditions = dto.HealthConditions;
        entity.EmergencyContact = dto.EmergencyContact;
        entity.EmergencyPhone = dto.EmergencyPhone;
        entity.AdmissionDate = dto.AdmissionDate;
        entity.Status = dto.Status;
        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }
}
