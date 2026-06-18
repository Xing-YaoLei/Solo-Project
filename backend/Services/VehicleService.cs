using CarServiceAppointment.API.Data;
using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CarServiceAppointment.API.Services;

public class VehicleService : IVehicleService
{
    private readonly AppointmentDbContext _context;

    public VehicleService(AppointmentDbContext context)
    {
        _context = context;
    }

    public async Task<List<VehicleDto>> GetListAsync(string? keyword = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Vehicles.AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            keyword = keyword.Trim();
            query = query.Where(v =>
                v.PlateNumber.Contains(keyword) ||
                v.VinNumber.Contains(keyword) ||
                v.OwnerName.Contains(keyword) ||
                v.OwnerPhone.Contains(keyword) ||
                v.Brand.Contains(keyword) ||
                v.Model.Contains(keyword));
        }

        return await query
            .OrderByDescending(v => v.UpdatedAt)
            .Select(v => new VehicleDto
            {
                Id = v.Id,
                PlateNumber = v.PlateNumber,
                VinNumber = v.VinNumber,
                Brand = v.Brand,
                Model = v.Model,
                OwnerName = v.OwnerName,
                OwnerPhone = v.OwnerPhone,
                Mileage = v.Mileage,
                LastMaintenanceDate = v.LastMaintenanceDate,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<VehicleDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Vehicles
            .Where(v => v.Id == id)
            .Select(v => new VehicleDto
            {
                Id = v.Id,
                PlateNumber = v.PlateNumber,
                VinNumber = v.VinNumber,
                Brand = v.Brand,
                Model = v.Model,
                OwnerName = v.OwnerName,
                OwnerPhone = v.OwnerPhone,
                Mileage = v.Mileage,
                LastMaintenanceDate = v.LastMaintenanceDate,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<VehicleDto?> GetByPlateNumberAsync(string plateNumber, CancellationToken cancellationToken = default)
    {
        return await _context.Vehicles
            .Where(v => v.PlateNumber == plateNumber)
            .Select(v => new VehicleDto
            {
                Id = v.Id,
                PlateNumber = v.PlateNumber,
                VinNumber = v.VinNumber,
                Brand = v.Brand,
                Model = v.Model,
                OwnerName = v.OwnerName,
                OwnerPhone = v.OwnerPhone,
                Mileage = v.Mileage,
                LastMaintenanceDate = v.LastMaintenanceDate,
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<VehicleDto> CreateAsync(CreateVehicleDto dto, CancellationToken cancellationToken = default)
    {
        var existing = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.PlateNumber == dto.PlateNumber || v.VinNumber == dto.VinNumber, cancellationToken);

        if (existing != null)
        {
            if (existing.PlateNumber == dto.PlateNumber)
                throw new InvalidOperationException($"车牌号 {dto.PlateNumber} 已存在");
            throw new InvalidOperationException($"车架号 {dto.VinNumber} 已存在");
        }

        var vehicle = new Vehicle
        {
            PlateNumber = dto.PlateNumber,
            VinNumber = dto.VinNumber,
            Brand = dto.Brand,
            Model = dto.Model,
            OwnerName = dto.OwnerName,
            OwnerPhone = dto.OwnerPhone,
            Mileage = dto.Mileage,
            LastMaintenanceDate = dto.LastMaintenanceDate,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync(cancellationToken);

        return new VehicleDto
        {
            Id = vehicle.Id,
            PlateNumber = vehicle.PlateNumber,
            VinNumber = vehicle.VinNumber,
            Brand = vehicle.Brand,
            Model = vehicle.Model,
            OwnerName = vehicle.OwnerName,
            OwnerPhone = vehicle.OwnerPhone,
            Mileage = vehicle.Mileage,
            LastMaintenanceDate = vehicle.LastMaintenanceDate,
            CreatedAt = vehicle.CreatedAt,
            UpdatedAt = vehicle.UpdatedAt
        };
    }

    public async Task<VehicleDto?> UpdateAsync(int id, UpdateVehicleDto dto, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles.FindAsync(id, cancellationToken);
        if (vehicle == null) return null;

        vehicle.Brand = dto.Brand;
        vehicle.Model = dto.Model;
        vehicle.OwnerName = dto.OwnerName;
        vehicle.OwnerPhone = dto.OwnerPhone;
        vehicle.Mileage = dto.Mileage;
        vehicle.LastMaintenanceDate = dto.LastMaintenanceDate;
        vehicle.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync(cancellationToken);

        return new VehicleDto
        {
            Id = vehicle.Id,
            PlateNumber = vehicle.PlateNumber,
            VinNumber = vehicle.VinNumber,
            Brand = vehicle.Brand,
            Model = vehicle.Model,
            OwnerName = vehicle.OwnerName,
            OwnerPhone = vehicle.OwnerPhone,
            Mileage = vehicle.Mileage,
            LastMaintenanceDate = vehicle.LastMaintenanceDate,
            CreatedAt = vehicle.CreatedAt,
            UpdatedAt = vehicle.UpdatedAt
        };
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _context.Vehicles.FindAsync(id, cancellationToken);
        if (vehicle == null) return false;

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
