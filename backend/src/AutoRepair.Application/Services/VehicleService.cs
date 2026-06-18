using Microsoft.EntityFrameworkCore;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.Services;

public class VehicleService : IVehicleService
{
    private readonly IAppDbContext _context;

    public VehicleService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<VehicleDto>> GetAllAsync()
    {
        return await _context.Vehicles
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => MapToDto(v))
            .ToListAsync();
    }

    public async Task<VehicleDto?> GetByIdAsync(Guid id)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        return vehicle != null ? MapToDto(vehicle) : null;
    }

    public async Task<VehicleDto?> GetByLicensePlateAsync(string licensePlate)
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.LicensePlate == licensePlate);
        return vehicle != null ? MapToDto(vehicle) : null;
    }

    public async Task<VehicleDto> CreateAsync(VehicleCreateDto dto)
    {
        var vehicle = new Vehicle
        {
            Id = Guid.NewGuid(),
            LicensePlate = dto.LicensePlate,
            VinCode = dto.VinCode,
            Brand = dto.Brand,
            Model = dto.Model,
            Series = dto.Series,
            ManufactureYear = dto.ManufactureYear,
            Color = dto.Color,
            Mileage = dto.Mileage,
            OwnerName = dto.OwnerName,
            OwnerPhone = dto.OwnerPhone,
            LastMaintenanceDate = dto.LastMaintenanceDate,
            NextMaintenanceMileage = dto.NextMaintenanceMileage,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();
        return MapToDto(vehicle);
    }

    public async Task<VehicleDto?> UpdateAsync(Guid id, VehicleUpdateDto dto)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null) return null;

        if (dto.Brand != null) vehicle.Brand = dto.Brand;
        if (dto.Model != null) vehicle.Model = dto.Model;
        vehicle.Mileage = dto.Mileage;
        if (dto.OwnerName != null) vehicle.OwnerName = dto.OwnerName;
        if (dto.OwnerPhone != null) vehicle.OwnerPhone = dto.OwnerPhone;
        if (dto.LastMaintenanceDate.HasValue) vehicle.LastMaintenanceDate = dto.LastMaintenanceDate.Value;
        if (dto.NextMaintenanceMileage.HasValue) vehicle.NextMaintenanceMileage = dto.NextMaintenanceMileage.Value;
        vehicle.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(vehicle);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var vehicle = await _context.Vehicles.FindAsync(id);
        if (vehicle == null) return false;
        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();
        return true;
    }

    private static VehicleDto MapToDto(Vehicle v) => new()
    {
        Id = v.Id,
        LicensePlate = v.LicensePlate,
        VinCode = v.VinCode,
        Brand = v.Brand,
        Model = v.Model,
        Series = v.Series,
        ManufactureYear = v.ManufactureYear,
        Color = v.Color,
        Mileage = v.Mileage,
        OwnerName = v.OwnerName,
        OwnerPhone = v.OwnerPhone,
        LastMaintenanceDate = v.LastMaintenanceDate,
        NextMaintenanceMileage = v.NextMaintenanceMileage,
        CreatedAt = v.CreatedAt ?? DateTime.UtcNow
    };
}
