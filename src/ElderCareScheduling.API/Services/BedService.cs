using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;
using ElderCareScheduling.API.Repositories;

namespace ElderCareScheduling.API.Services;

public class BedService : IBedService
{
    private readonly IUnitOfWork _unitOfWork;

    public BedService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<BedDto>> GetAllAsync()
    {
        var beds = await _unitOfWork.Beds.GetAllAsync();
        return beds
            .Where(b => b.IsActive)
            .OrderBy(b => b.CreatedAt)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<List<BedDto>> GetAvailableAsync()
    {
        var beds = await _unitOfWork.Beds.GetAvailableBedsAsync();
        return beds
            .OrderBy(b => b.CreatedAt)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<BedDto?> GetByIdAsync(Guid id)
    {
        var bed = await _unitOfWork.Beds.GetByIdAsync(id);
        return bed == null ? null : MapToDto(bed);
    }

    private BedDto MapToDto(Bed bed)
    {
        return new BedDto
        {
            Id = bed.Id,
            BedNumber = bed.BedNumber,
            RoomNumber = bed.RoomNumber,
            Floor = bed.Floor,
            Building = bed.Building,
            Description = bed.Description,
            Status = bed.Status,
            StatusText = EnumHelper.GetBedStatusText(bed.Status),
            EquipmentInfo = bed.EquipmentInfo
        };
    }
}
