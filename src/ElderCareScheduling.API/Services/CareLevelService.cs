using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;
using ElderCareScheduling.API.Repositories;

namespace ElderCareScheduling.API.Services;

public class CareLevelService : ICareLevelService
{
    private readonly IUnitOfWork _unitOfWork;

    public CareLevelService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<CareLevelDto>> GetAllAsync()
    {
        var careLevels = await _unitOfWork.CareLevels.GetAllAsync();
        return careLevels
            .Where(c => c.IsActive)
            .OrderBy(c => c.CreatedAt)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<CareLevelDto?> GetByIdAsync(Guid id)
    {
        var careLevel = await _unitOfWork.CareLevels.GetByIdAsync(id);
        return careLevel == null ? null : MapToDto(careLevel);
    }

    private CareLevelDto MapToDto(CareLevel careLevel)
    {
        return new CareLevelDto
        {
            Id = careLevel.Id,
            LevelType = careLevel.LevelType,
            LevelTypeText = EnumHelper.GetCareLevelTypeText(careLevel.LevelType),
            LevelName = careLevel.LevelName,
            Description = careLevel.Description,
            CareItems = careLevel.CareItems,
            ServiceStandards = careLevel.ServiceStandards,
            DailyCareHours = careLevel.DailyCareHours,
            NurseRatio = careLevel.NurseRatio,
            MonthlyFee = careLevel.MonthlyFee
        };
    }
}
