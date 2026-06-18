using CarServiceAppointment.API.DTOs;

namespace CarServiceAppointment.API.Services;

public interface IVehicleService
{
    Task<List<VehicleDto>> GetListAsync(string? keyword = null, CancellationToken cancellationToken = default);
    Task<VehicleDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<VehicleDto?> GetByPlateNumberAsync(string plateNumber, CancellationToken cancellationToken = default);
    Task<VehicleDto> CreateAsync(CreateVehicleDto dto, CancellationToken cancellationToken = default);
    Task<VehicleDto?> UpdateAsync(int id, UpdateVehicleDto dto, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
