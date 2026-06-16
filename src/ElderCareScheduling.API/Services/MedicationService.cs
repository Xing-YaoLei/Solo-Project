using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;
using ElderCareScheduling.API.Repositories;

namespace ElderCareScheduling.API.Services;

public class MedicationService : IMedicationService
{
    private readonly IUnitOfWork _unitOfWork;

    public MedicationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<MedicationDto>> GetByElderIdAsync(Guid elderId)
    {
        var medications = await _unitOfWork.Medications.GetByElderIdAsync(elderId);
        return medications
            .Where(m => m.IsActive)
            .OrderBy(m => m.CreatedAt)
            .Select(MapToDto)
            .ToList();
    }

    public async Task<MedicationDto> CreateAsync(CreateMedicationDto dto)
    {
        if (dto.ElderId == Guid.Empty)
            throw new ArgumentException("老人ID不能为空");
        if (string.IsNullOrWhiteSpace(dto.DrugName))
            throw new ArgumentException("药品名称不能为空");

        var elderExists = await _unitOfWork.Elders.ExistsAsync(e => e.Id == dto.ElderId);
        if (!elderExists)
            throw new KeyNotFoundException($"未找到ID为 {dto.ElderId} 的老人记录");

        var medication = new Medication
        {
            Id = Guid.NewGuid(),
            ElderId = dto.ElderId,
            DrugName = dto.DrugName,
            GenericName = dto.GenericName,
            Specification = dto.Specification,
            Dosage = dto.Dosage,
            Frequency = dto.Frequency,
            AdministrationRoute = dto.AdministrationRoute,
            UsageInstructions = dto.UsageInstructions,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            PrescribingDoctor = dto.PrescribingDoctor,
            Precautions = dto.Precautions,
            SideEffects = dto.SideEffects,
            RemainingQuantity = dto.RemainingQuantity,
            StorageConditions = dto.StorageConditions,
            IsActive = true,
            CreatedAt = DateTime.Now,
            CreatedBy = dto.CreatedBy
        };

        await _unitOfWork.Medications.AddAsync(medication);
        await _unitOfWork.CompleteAsync();

        var created = await _unitOfWork.Medications.GetByIdAsync(medication.Id);
        return MapToDto(created!);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var medication = await _unitOfWork.Medications.GetByIdAsync(id);
        if (medication == null) return false;

        _unitOfWork.Medications.Remove(medication);
        var result = await _unitOfWork.CompleteAsync();
        return result > 0;
    }

    private MedicationDto MapToDto(Medication medication)
    {
        return new MedicationDto
        {
            Id = medication.Id,
            ElderId = medication.ElderId,
            DrugName = medication.DrugName,
            GenericName = medication.GenericName,
            Specification = medication.Specification,
            Dosage = medication.Dosage,
            Frequency = medication.Frequency,
            AdministrationRoute = medication.AdministrationRoute,
            UsageInstructions = medication.UsageInstructions,
            StartDate = medication.StartDate,
            EndDate = medication.EndDate,
            PrescribingDoctor = medication.PrescribingDoctor,
            Precautions = medication.Precautions,
            SideEffects = medication.SideEffects,
            RemainingQuantity = medication.RemainingQuantity,
            StorageConditions = medication.StorageConditions,
            IsActive = medication.IsActive,
            CreatedAt = medication.CreatedAt
        };
    }
}
