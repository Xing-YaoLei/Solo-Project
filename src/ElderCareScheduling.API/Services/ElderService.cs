using ElderCareScheduling.API.Enums;
using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;
using ElderCareScheduling.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ElderCareScheduling.API.Services;

public class ElderService : IElderService
{
    private readonly IUnitOfWork _unitOfWork;

    public ElderService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResultDto<ElderListDto>> GetListAsync(ElderQueryDto query)
    {
        if (query.PageIndex < 1) query.PageIndex = 1;
        if (query.PageSize < 1) query.PageSize = 20;

        var allElders = await _unitOfWork.Elders.GetAllAsync();
        var queryable = allElders.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            queryable = queryable.Where(e =>
                e.Name.Contains(query.Keyword) ||
                (!string.IsNullOrEmpty(e.IdCardNumber) && e.IdCardNumber.Contains(query.Keyword)) ||
                (!string.IsNullOrEmpty(e.PhoneNumber) && e.PhoneNumber.Contains(query.Keyword)));
        }

        if (query.Gender.HasValue)
        {
            queryable = queryable.Where(e => e.Gender == query.Gender.Value);
        }

        if (query.SourceType.HasValue)
        {
            queryable = queryable.Where(e => e.SourceType == query.SourceType.Value);
        }

        if (query.IsActive.HasValue)
        {
            queryable = queryable.Where(e => e.IsActive == query.IsActive.Value);
        }

        var totalCount = queryable.Count();

        var items = queryable
            .OrderByDescending(e => e.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToList();

        var careLevelIds = items.Where(e => e.CareLevelId.HasValue).Select(e => e.CareLevelId!.Value).Distinct().ToList();
        var careLevels = new Dictionary<Guid, CareLevel>();
        if (careLevelIds.Any())
        {
            foreach (var clId in careLevelIds)
            {
                var cl = await _unitOfWork.CareLevels.GetByIdAsync(clId);
                if (cl != null) careLevels[clId] = cl;
            }
        }

        var dtoItems = items.Select(e =>
        {
            CareLevel? careLevel = null;
            if (e.CareLevelId.HasValue && careLevels.TryGetValue(e.CareLevelId.Value, out var found))
            {
                careLevel = found;
            }

            return new ElderListDto
            {
                Id = e.Id,
                Name = e.Name,
                Gender = e.Gender,
                GenderText = EnumHelper.GetGenderText(e.Gender),
                DateOfBirth = e.DateOfBirth,
                Age = e.Age,
                IdCardNumber = e.IdCardNumber,
                PhoneNumber = e.PhoneNumber,
                CareLevelName = careLevel?.LevelName,
                CareLevelType = careLevel?.LevelType,
                SourceType = e.SourceType,
                SourceTypeText = EnumHelper.GetSourceTypeText(e.SourceType),
                IsActive = e.IsActive,
                CreatedAt = e.CreatedAt
            };
        }).ToList();

        return new PagedResultDto<ElderListDto>
        {
            Items = dtoItems,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<ElderDetailDto?> GetByIdAsync(Guid id)
    {
        var elder = await _unitOfWork.Elders.GetWithDetailsAsync(id);
        if (elder == null) return null;

        return MapToDetailDto(elder);
    }

    public async Task<ElderDetailDto> CreateAsync(CreateElderDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("老人姓名不能为空");
        if (dto.DateOfBirth == default)
            throw new ArgumentException("出生日期不能为空");

        var elder = new Elder
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Gender = dto.Gender,
            DateOfBirth = dto.DateOfBirth,
            IdCardNumber = dto.IdCardNumber,
            PhoneNumber = dto.PhoneNumber,
            EmergencyContact = dto.EmergencyContact,
            EmergencyPhone = dto.EmergencyPhone,
            Address = dto.Address,
            MedicalHistory = dto.MedicalHistory,
            AllergyInfo = dto.AllergyInfo,
            DietaryRequirements = dto.DietaryRequirements,
            Notes = dto.Notes,
            SourceType = dto.SourceType,
            SourceDetail = dto.SourceDetail,
            CareLevelId = dto.CareLevelId,
            CreatedAt = DateTime.Now,
            CreatedBy = dto.CreatedBy,
            IsActive = true
        };

        await _unitOfWork.Elders.AddAsync(elder);
        await _unitOfWork.CompleteAsync();

        var created = await _unitOfWork.Elders.GetWithDetailsAsync(elder.Id);
        return MapToDetailDto(created!);
    }

    public async Task<ElderDetailDto> UpdateAsync(Guid id, UpdateElderDto dto)
    {
        var elder = await _unitOfWork.Elders.GetByIdAsync(id);
        if (elder == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的老人记录");

        if (!string.IsNullOrWhiteSpace(dto.Name)) elder.Name = dto.Name;
        if (dto.Gender.HasValue) elder.Gender = dto.Gender.Value;
        if (dto.DateOfBirth.HasValue) elder.DateOfBirth = dto.DateOfBirth.Value;
        if (dto.IdCardNumber != null) elder.IdCardNumber = dto.IdCardNumber;
        if (dto.PhoneNumber != null) elder.PhoneNumber = dto.PhoneNumber;
        if (dto.EmergencyContact != null) elder.EmergencyContact = dto.EmergencyContact;
        if (dto.EmergencyPhone != null) elder.EmergencyPhone = dto.EmergencyPhone;
        if (dto.Address != null) elder.Address = dto.Address;
        if (dto.MedicalHistory != null) elder.MedicalHistory = dto.MedicalHistory;
        if (dto.AllergyInfo != null) elder.AllergyInfo = dto.AllergyInfo;
        if (dto.DietaryRequirements != null) elder.DietaryRequirements = dto.DietaryRequirements;
        if (dto.Notes != null) elder.Notes = dto.Notes;
        if (dto.SourceType.HasValue) elder.SourceType = dto.SourceType.Value;
        if (dto.SourceDetail != null) elder.SourceDetail = dto.SourceDetail;
        if (dto.CareLevelId.HasValue) elder.CareLevelId = dto.CareLevelId.Value;
        if (dto.IsActive.HasValue) elder.IsActive = dto.IsActive.Value;

        elder.UpdatedAt = DateTime.Now;
        elder.UpdatedBy = dto.UpdatedBy;

        _unitOfWork.Elders.Update(elder);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.Elders.GetWithDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var elder = await _unitOfWork.Elders.GetByIdAsync(id);
        if (elder == null) return false;

        _unitOfWork.Elders.Remove(elder);
        var result = await _unitOfWork.CompleteAsync();
        return result > 0;
    }

    private ElderDetailDto MapToDetailDto(Elder elder)
    {
        CareLevelDto? careLevelDto = null;
        if (elder.CareLevel != null)
        {
            careLevelDto = new CareLevelDto
            {
                Id = elder.CareLevel.Id,
                LevelType = elder.CareLevel.LevelType,
                LevelTypeText = EnumHelper.GetCareLevelTypeText(elder.CareLevel.LevelType),
                LevelName = elder.CareLevel.LevelName,
                Description = elder.CareLevel.Description,
                CareItems = elder.CareLevel.CareItems,
                ServiceStandards = elder.CareLevel.ServiceStandards,
                DailyCareHours = elder.CareLevel.DailyCareHours,
                NurseRatio = elder.CareLevel.NurseRatio,
                MonthlyFee = elder.CareLevel.MonthlyFee
            };
        }

        var medications = elder.Medications?.Select(m => new MedicationDto
        {
            Id = m.Id,
            ElderId = m.ElderId,
            DrugName = m.DrugName,
            GenericName = m.GenericName,
            Specification = m.Specification,
            Dosage = m.Dosage,
            Frequency = m.Frequency,
            AdministrationRoute = m.AdministrationRoute,
            UsageInstructions = m.UsageInstructions,
            StartDate = m.StartDate,
            EndDate = m.EndDate,
            PrescribingDoctor = m.PrescribingDoctor,
            Precautions = m.Precautions,
            SideEffects = m.SideEffects,
            RemainingQuantity = m.RemainingQuantity,
            StorageConditions = m.StorageConditions,
            IsActive = m.IsActive,
            CreatedAt = m.CreatedAt
        }).ToList() ?? new List<MedicationDto>();

        return new ElderDetailDto
        {
            Id = elder.Id,
            Name = elder.Name,
            Gender = elder.Gender,
            GenderText = EnumHelper.GetGenderText(elder.Gender),
            DateOfBirth = elder.DateOfBirth,
            Age = elder.Age,
            IdCardNumber = elder.IdCardNumber,
            PhoneNumber = elder.PhoneNumber,
            EmergencyContact = elder.EmergencyContact,
            EmergencyPhone = elder.EmergencyPhone,
            Address = elder.Address,
            MedicalHistory = elder.MedicalHistory,
            AllergyInfo = elder.AllergyInfo,
            DietaryRequirements = elder.DietaryRequirements,
            Notes = elder.Notes,
            SourceType = elder.SourceType,
            SourceTypeText = EnumHelper.GetSourceTypeText(elder.SourceType),
            SourceDetail = elder.SourceDetail,
            CareLevelId = elder.CareLevelId,
            CareLevel = careLevelDto,
            Medications = medications,
            IsActive = elder.IsActive,
            CreatedAt = elder.CreatedAt,
            CreatedBy = elder.CreatedBy
        };
    }
}
