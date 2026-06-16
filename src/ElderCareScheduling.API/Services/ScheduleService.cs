using ElderCareScheduling.API.Enums;
using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;
using ElderCareScheduling.API.Repositories;

namespace ElderCareScheduling.API.Services;

public class ScheduleService : IScheduleService
{
    private readonly IUnitOfWork _unitOfWork;

    public ScheduleService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResultDto<ScheduleListDto>> GetListAsync(ScheduleQueryDto query)
    {
        var pagedResult = await _unitOfWork.Schedules.GetPagedListAsync(query);

        foreach (var item in pagedResult.Items)
        {
            item.StatusText = EnumHelper.GetScheduleStatusText(item.Status);
        }

        return pagedResult;
    }

    public async Task<ScheduleDetailDto?> GetByIdAsync(Guid id)
    {
        var schedule = await _unitOfWork.Schedules.GetWithFullDetailsAsync(id);
        if (schedule == null) return null;

        return MapToDetailDto(schedule);
    }

    public async Task<ScheduleDetailDto> CreateAsync(CreateScheduleDto dto)
    {
        if (dto.ElderId == Guid.Empty)
            throw new ArgumentException("老人ID不能为空");
        if (dto.StartDate == default)
            throw new ArgumentException("开始日期不能为空");
        if (dto.EndDate == default)
            throw new ArgumentException("结束日期不能为空");
        if (dto.EndDate < dto.StartDate)
            throw new ArgumentException("结束日期不能早于开始日期");

        var elderExists = await _unitOfWork.Elders.ExistsAsync(e => e.Id == dto.ElderId);
        if (!elderExists)
            throw new KeyNotFoundException($"未找到ID为 {dto.ElderId} 的老人记录");

        if (dto.BedId.HasValue)
        {
            var bedExists = await _unitOfWork.Beds.ExistsAsync(b => b.Id == dto.BedId.Value);
            if (!bedExists)
                throw new KeyNotFoundException($"未找到ID为 {dto.BedId.Value} 的床位记录");
        }

        if (dto.CareLevelId.HasValue)
        {
            var careLevelExists = await _unitOfWork.CareLevels.ExistsAsync(c => c.Id == dto.CareLevelId.Value);
            if (!careLevelExists)
                throw new KeyNotFoundException($"未找到ID为 {dto.CareLevelId.Value} 的护理等级记录");
        }

        var scheduleNo = await _unitOfWork.Schedules.GenerateScheduleNoAsync();

        var schedule = new CareSchedule
        {
            Id = Guid.NewGuid(),
            ScheduleNo = scheduleNo,
            ElderId = dto.ElderId,
            BedId = dto.BedId,
            CareLevelId = dto.CareLevelId,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            ShiftType = dto.ShiftType,
            PrimaryNurse = dto.PrimaryNurse,
            SecondaryNurse = dto.SecondaryNurse,
            DoctorOnDuty = dto.DoctorOnDuty,
            CarePlan = dto.CarePlan,
            SpecialRequirements = dto.SpecialRequirements,
            NutritionPlan = dto.NutritionPlan,
            RehabilitationPlan = dto.RehabilitationPlan,
            DailySchedule = dto.DailySchedule,
            Status = ScheduleStatus.Draft,
            CareStandard = CareStandard.NotEvaluated,
            CreatedAt = DateTime.Now,
            CreatedBy = dto.CreatedBy
        };

        await _unitOfWork.Schedules.AddAsync(schedule);
        await _unitOfWork.CompleteAsync();

        var created = await _unitOfWork.Schedules.GetWithFullDetailsAsync(schedule.Id);
        return MapToDetailDto(created!);
    }

    public async Task<ScheduleDetailDto> UpdateAsync(Guid id, UpdateScheduleDto dto)
    {
        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的排班记录");

        if (schedule.Status >= ScheduleStatus.InProgress)
            throw new InvalidOperationException($"当前状态 {EnumHelper.GetScheduleStatusText(schedule.Status)} 不允许修改");

        if (dto.BedId.HasValue)
        {
            var bedExists = await _unitOfWork.Beds.ExistsAsync(b => b.Id == dto.BedId.Value);
            if (!bedExists)
                throw new KeyNotFoundException($"未找到ID为 {dto.BedId.Value} 的床位记录");
            schedule.BedId = dto.BedId.Value;
        }

        if (dto.CareLevelId.HasValue)
        {
            var careLevelExists = await _unitOfWork.CareLevels.ExistsAsync(c => c.Id == dto.CareLevelId.Value);
            if (!careLevelExists)
                throw new KeyNotFoundException($"未找到ID为 {dto.CareLevelId.Value} 的护理等级记录");
            schedule.CareLevelId = dto.CareLevelId.Value;
        }

        if (dto.StartDate.HasValue) schedule.StartDate = dto.StartDate.Value;
        if (dto.EndDate.HasValue) schedule.EndDate = dto.EndDate.Value;
        if (dto.ShiftType.HasValue) schedule.ShiftType = dto.ShiftType.Value;
        if (dto.PrimaryNurse != null) schedule.PrimaryNurse = dto.PrimaryNurse;
        if (dto.SecondaryNurse != null) schedule.SecondaryNurse = dto.SecondaryNurse;
        if (dto.DoctorOnDuty != null) schedule.DoctorOnDuty = dto.DoctorOnDuty;
        if (dto.CarePlan != null) schedule.CarePlan = dto.CarePlan;
        if (dto.SpecialRequirements != null) schedule.SpecialRequirements = dto.SpecialRequirements;
        if (dto.NutritionPlan != null) schedule.NutritionPlan = dto.NutritionPlan;
        if (dto.RehabilitationPlan != null) schedule.RehabilitationPlan = dto.RehabilitationPlan;
        if (dto.DailySchedule != null) schedule.DailySchedule = dto.DailySchedule;
        if (dto.ProcessingNotes != null) schedule.ProcessingNotes = dto.ProcessingNotes;

        schedule.UpdatedAt = DateTime.Now;
        schedule.UpdatedBy = dto.UpdatedBy;

        _unitOfWork.Schedules.Update(schedule);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.Schedules.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null) return false;

        if (schedule.Status != ScheduleStatus.Draft && schedule.Status != ScheduleStatus.ReviewRejected)
            throw new InvalidOperationException($"当前状态 {EnumHelper.GetScheduleStatusText(schedule.Status)} 不允许删除");

        _unitOfWork.Schedules.Remove(schedule);
        var result = await _unitOfWork.CompleteAsync();
        return result > 0;
    }

    public async Task<ScheduleDetailDto> SubmitForReviewAsync(Guid id, string operatorName)
    {
        if (string.IsNullOrWhiteSpace(operatorName))
            throw new ArgumentException("操作人不能为空");

        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的排班记录");

        if (schedule.Status != ScheduleStatus.Draft)
            throw new InvalidOperationException($"只有草稿状态可以提交审核，当前状态：{EnumHelper.GetScheduleStatusText(schedule.Status)}");

        var previousStatus = schedule.Status;
        schedule.Status = ScheduleStatus.Submitted;
        schedule.SubmittedAt = DateTime.Now;
        schedule.SubmittedBy = operatorName;
        schedule.UpdatedAt = DateTime.Now;
        schedule.UpdatedBy = operatorName;

        await AddStatusHistoryAsync(schedule.Id, previousStatus, schedule.Status, "提交审核", operatorName);

        _unitOfWork.Schedules.Update(schedule);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.Schedules.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ScheduleDetailDto> ApproveReviewAsync(Guid id, ScheduleStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");

        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的排班记录");

        if (schedule.Status != ScheduleStatus.Submitted && schedule.Status != ScheduleStatus.UnderReview)
            throw new InvalidOperationException($"只有已提交或审核中状态可以通过审核，当前状态：{EnumHelper.GetScheduleStatusText(schedule.Status)}");

        var previousStatus = schedule.Status;
        schedule.Status = ScheduleStatus.ReviewApproved;
        schedule.ReviewedAt = DateTime.Now;
        schedule.ReviewedBy = dto.Operator;
        if (!string.IsNullOrWhiteSpace(dto.ReviewComments))
            schedule.ReviewComments = dto.ReviewComments;
        schedule.UpdatedAt = DateTime.Now;
        schedule.UpdatedBy = dto.Operator;

        await AddStatusHistoryAsync(schedule.Id, previousStatus, schedule.Status, dto.ChangeReason ?? "审核通过", dto.Operator);

        if (dto.ReviewResult.HasValue || dto.CareStandard.HasValue)
        {
            await AddReviewRecordInternalAsync(schedule.Id, null, ReviewType.ScheduleReview, dto);
        }

        _unitOfWork.Schedules.Update(schedule);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.Schedules.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ScheduleDetailDto> RejectReviewAsync(Guid id, ScheduleStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");
        if (string.IsNullOrWhiteSpace(dto.ReviewComments) && string.IsNullOrWhiteSpace(dto.ChangeReason))
            throw new ArgumentException("驳回原因不能为空");

        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的排班记录");

        if (schedule.Status != ScheduleStatus.Submitted && schedule.Status != ScheduleStatus.UnderReview)
            throw new InvalidOperationException($"只有已提交或审核中状态可以驳回审核，当前状态：{EnumHelper.GetScheduleStatusText(schedule.Status)}");

        var previousStatus = schedule.Status;
        schedule.Status = ScheduleStatus.ReviewRejected;
        schedule.ReviewedAt = DateTime.Now;
        schedule.ReviewedBy = dto.Operator;
        schedule.ReviewComments = dto.ReviewComments ?? dto.ChangeReason;
        schedule.UpdatedAt = DateTime.Now;
        schedule.UpdatedBy = dto.Operator;

        await AddStatusHistoryAsync(schedule.Id, previousStatus, schedule.Status, dto.ChangeReason ?? dto.ReviewComments ?? "审核驳回", dto.Operator);

        if (dto.ReviewResult.HasValue)
        {
            await AddReviewRecordInternalAsync(schedule.Id, null, ReviewType.ScheduleReview, dto);
        }

        _unitOfWork.Schedules.Update(schedule);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.Schedules.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ScheduleDetailDto> StartProcessingAsync(Guid id, string operatorName)
    {
        if (string.IsNullOrWhiteSpace(operatorName))
            throw new ArgumentException("操作人不能为空");

        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的排班记录");

        if (schedule.Status != ScheduleStatus.ReviewApproved)
            throw new InvalidOperationException($"只有审核通过状态可以开始处理，当前状态：{EnumHelper.GetScheduleStatusText(schedule.Status)}");

        var previousStatus = schedule.Status;
        schedule.Status = ScheduleStatus.InProgress;
        schedule.StartedAt = DateTime.Now;
        schedule.StartedBy = operatorName;
        schedule.UpdatedAt = DateTime.Now;
        schedule.UpdatedBy = operatorName;

        await AddStatusHistoryAsync(schedule.Id, previousStatus, schedule.Status, "开始处理", operatorName);

        _unitOfWork.Schedules.Update(schedule);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.Schedules.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ScheduleDetailDto> CompleteProcessingAsync(Guid id, ScheduleStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");

        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的排班记录");

        if (schedule.Status != ScheduleStatus.InProgress &&
            schedule.Status != ScheduleStatus.Processing &&
            schedule.Status != ScheduleStatus.ExceptionOccurred)
            throw new InvalidOperationException($"只有进行中/处理中/异常发生状态可以完成处理，当前状态：{EnumHelper.GetScheduleStatusText(schedule.Status)}");

        var previousStatus = schedule.Status;
        schedule.Status = ScheduleStatus.Completed;
        schedule.CompletedAt = DateTime.Now;
        schedule.CompletedBy = dto.Operator;
        if (!string.IsNullOrWhiteSpace(dto.ChangeReason))
            schedule.ProcessingNotes = dto.ChangeReason;
        schedule.UpdatedAt = DateTime.Now;
        schedule.UpdatedBy = dto.Operator;

        await AddStatusHistoryAsync(schedule.Id, previousStatus, schedule.Status, dto.ChangeReason ?? "完成处理", dto.Operator);

        _unitOfWork.Schedules.Update(schedule);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.Schedules.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ScheduleDetailDto> SubmitPostReviewAsync(Guid id, string operatorName)
    {
        if (string.IsNullOrWhiteSpace(operatorName))
            throw new ArgumentException("操作人不能为空");

        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的排班记录");

        if (schedule.Status != ScheduleStatus.Completed)
            throw new InvalidOperationException($"只有已完成状态可以提交复盘，当前状态：{EnumHelper.GetScheduleStatusText(schedule.Status)}");

        var previousStatus = schedule.Status;
        schedule.Status = ScheduleStatus.UnderReviewPost;
        schedule.UpdatedAt = DateTime.Now;
        schedule.UpdatedBy = operatorName;

        await AddStatusHistoryAsync(schedule.Id, previousStatus, schedule.Status, "提交复盘审核", operatorName);

        _unitOfWork.Schedules.Update(schedule);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.Schedules.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ScheduleDetailDto> CompletePostReviewAsync(Guid id, ScheduleStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");

        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的排班记录");

        if (schedule.Status != ScheduleStatus.UnderReviewPost)
            throw new InvalidOperationException($"只有复盘审核中状态可以完成复盘，当前状态：{EnumHelper.GetScheduleStatusText(schedule.Status)}");

        var previousStatus = schedule.Status;
        schedule.Status = ScheduleStatus.Reviewed;
        schedule.PostReviewedAt = DateTime.Now;
        schedule.PostReviewedBy = dto.Operator;
        if (dto.CareStandard.HasValue)
            schedule.CareStandard = dto.CareStandard.Value;
        if (!string.IsNullOrWhiteSpace(dto.PostReviewSummary))
            schedule.PostReviewSummary = dto.PostReviewSummary;
        schedule.UpdatedAt = DateTime.Now;
        schedule.UpdatedBy = dto.Operator;

        await AddStatusHistoryAsync(schedule.Id, previousStatus, schedule.Status, dto.ChangeReason ?? "完成复盘", dto.Operator);

        await AddReviewRecordInternalAsync(schedule.Id, null, ReviewType.PostProcessReview, dto);

        _unitOfWork.Schedules.Update(schedule);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.Schedules.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ScheduleDetailDto> CloseScheduleAsync(Guid id, string operatorName)
    {
        if (string.IsNullOrWhiteSpace(operatorName))
            throw new ArgumentException("操作人不能为空");

        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的排班记录");

        if (schedule.Status != ScheduleStatus.Reviewed)
            throw new InvalidOperationException($"只有已复盘状态可以关闭，当前状态：{EnumHelper.GetScheduleStatusText(schedule.Status)}");

        var previousStatus = schedule.Status;
        schedule.Status = ScheduleStatus.Closed;
        schedule.ClosedAt = DateTime.Now;
        schedule.ClosedBy = operatorName;
        schedule.UpdatedAt = DateTime.Now;
        schedule.UpdatedBy = operatorName;

        await AddStatusHistoryAsync(schedule.Id, previousStatus, schedule.Status, "关闭排班", operatorName);

        _unitOfWork.Schedules.Update(schedule);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.Schedules.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ScheduleDetailDto> ChangeStatusAsync(Guid id, ScheduleStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");

        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的排班记录");

        var previousStatus = schedule.Status;
        var newStatus = dto.NewStatus;

        switch (newStatus)
        {
            case ScheduleStatus.Submitted:
                schedule.SubmittedAt = DateTime.Now;
                schedule.SubmittedBy = dto.Operator;
                break;
            case ScheduleStatus.ReviewApproved:
            case ScheduleStatus.ReviewRejected:
                schedule.ReviewedAt = DateTime.Now;
                schedule.ReviewedBy = dto.Operator;
                if (!string.IsNullOrWhiteSpace(dto.ReviewComments))
                    schedule.ReviewComments = dto.ReviewComments;
                break;
            case ScheduleStatus.InProgress:
                schedule.StartedAt = DateTime.Now;
                schedule.StartedBy = dto.Operator;
                break;
            case ScheduleStatus.Completed:
                schedule.CompletedAt = DateTime.Now;
                schedule.CompletedBy = dto.Operator;
                break;
            case ScheduleStatus.Reviewed:
                schedule.PostReviewedAt = DateTime.Now;
                schedule.PostReviewedBy = dto.Operator;
                if (dto.CareStandard.HasValue)
                    schedule.CareStandard = dto.CareStandard.Value;
                if (!string.IsNullOrWhiteSpace(dto.PostReviewSummary))
                    schedule.PostReviewSummary = dto.PostReviewSummary;
                break;
            case ScheduleStatus.Closed:
                schedule.ClosedAt = DateTime.Now;
                schedule.ClosedBy = dto.Operator;
                break;
        }

        schedule.Status = newStatus;
        schedule.UpdatedAt = DateTime.Now;
        schedule.UpdatedBy = dto.Operator;

        await AddStatusHistoryAsync(schedule.Id, previousStatus, newStatus, dto.ChangeReason ?? "状态变更", dto.Operator);

        _unitOfWork.Schedules.Update(schedule);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.Schedules.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task AddReviewRecordAsync(Guid id, ReviewRecord reviewRecord)
    {
        var schedule = await _unitOfWork.Schedules.GetByIdAsync(id);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的排班记录");

        reviewRecord.Id = Guid.NewGuid();
        reviewRecord.ScheduleId = id;
        reviewRecord.ReviewedAt = DateTime.Now;

        await _unitOfWork.ReviewRecords.AddAsync(reviewRecord);
        await _unitOfWork.CompleteAsync();
    }

    private async Task AddStatusHistoryAsync(Guid scheduleId, ScheduleStatus previousStatus, ScheduleStatus newStatus, string changeReason, string changedBy)
    {
        var history = new ScheduleStatusHistory
        {
            Id = Guid.NewGuid(),
            ScheduleId = scheduleId,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            ChangeReason = changeReason,
            ChangedAt = DateTime.Now,
            ChangedBy = changedBy
        };

        var schedule = await _unitOfWork.Schedules.GetByIdAsync(scheduleId);
        if (schedule != null)
        {
            schedule.StatusHistories ??= new List<ScheduleStatusHistory>();
            schedule.StatusHistories.Add(history);
        }
    }

    private async Task AddReviewRecordInternalAsync(Guid? scheduleId, Guid? exceptionId, ReviewType reviewType, ScheduleStatusChangeDto dto)
    {
        var reviewRecord = new ReviewRecord
        {
            Id = Guid.NewGuid(),
            ReviewType = reviewType,
            ScheduleId = scheduleId,
            ExceptionRecordId = exceptionId,
            ReviewResult = dto.ReviewResult ?? ReviewResult.Approved,
            ReviewComment = dto.ReviewComments,
            CareStandardRating = dto.CareStandard,
            Reviewer = dto.Operator,
            ReviewedAt = DateTime.Now
        };

        await _unitOfWork.ReviewRecords.AddAsync(reviewRecord);
    }

    private ScheduleDetailDto MapToDetailDto(CareSchedule schedule)
    {
        ElderDetailDto elderDto = new();
        if (schedule.Elder != null)
        {
            CareLevelDto? elderCareLevelDto = null;
            if (schedule.Elder.CareLevel != null)
            {
                elderCareLevelDto = new CareLevelDto
                {
                    Id = schedule.Elder.CareLevel.Id,
                    LevelType = schedule.Elder.CareLevel.LevelType,
                    LevelTypeText = EnumHelper.GetCareLevelTypeText(schedule.Elder.CareLevel.LevelType),
                    LevelName = schedule.Elder.CareLevel.LevelName,
                    Description = schedule.Elder.CareLevel.Description,
                    CareItems = schedule.Elder.CareLevel.CareItems,
                    ServiceStandards = schedule.Elder.CareLevel.ServiceStandards,
                    DailyCareHours = schedule.Elder.CareLevel.DailyCareHours,
                    NurseRatio = schedule.Elder.CareLevel.NurseRatio,
                    MonthlyFee = schedule.Elder.CareLevel.MonthlyFee
                };
            }

            var elderMedications = schedule.Elder.Medications?.Select(m => new MedicationDto
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

            elderDto = new ElderDetailDto
            {
                Id = schedule.Elder.Id,
                Name = schedule.Elder.Name,
                Gender = schedule.Elder.Gender,
                GenderText = EnumHelper.GetGenderText(schedule.Elder.Gender),
                DateOfBirth = schedule.Elder.DateOfBirth,
                Age = schedule.Elder.Age,
                IdCardNumber = schedule.Elder.IdCardNumber,
                PhoneNumber = schedule.Elder.PhoneNumber,
                EmergencyContact = schedule.Elder.EmergencyContact,
                EmergencyPhone = schedule.Elder.EmergencyPhone,
                Address = schedule.Elder.Address,
                MedicalHistory = schedule.Elder.MedicalHistory,
                AllergyInfo = schedule.Elder.AllergyInfo,
                DietaryRequirements = schedule.Elder.DietaryRequirements,
                Notes = schedule.Elder.Notes,
                SourceType = schedule.Elder.SourceType,
                SourceTypeText = EnumHelper.GetSourceTypeText(schedule.Elder.SourceType),
                SourceDetail = schedule.Elder.SourceDetail,
                CareLevelId = schedule.Elder.CareLevelId,
                CareLevel = elderCareLevelDto,
                Medications = elderMedications,
                IsActive = schedule.Elder.IsActive,
                CreatedAt = schedule.Elder.CreatedAt,
                CreatedBy = schedule.Elder.CreatedBy
            };
        }

        BedDto? bedDto = null;
        if (schedule.Bed != null)
        {
            bedDto = new BedDto
            {
                Id = schedule.Bed.Id,
                BedNumber = schedule.Bed.BedNumber,
                RoomNumber = schedule.Bed.RoomNumber,
                Floor = schedule.Bed.Floor,
                Building = schedule.Bed.Building,
                Description = schedule.Bed.Description,
                Status = schedule.Bed.Status,
                StatusText = EnumHelper.GetBedStatusText(schedule.Bed.Status),
                EquipmentInfo = schedule.Bed.EquipmentInfo
            };
        }

        CareLevelDto? careLevelDto = null;
        if (schedule.CareLevel != null)
        {
            careLevelDto = new CareLevelDto
            {
                Id = schedule.CareLevel.Id,
                LevelType = schedule.CareLevel.LevelType,
                LevelTypeText = EnumHelper.GetCareLevelTypeText(schedule.CareLevel.LevelType),
                LevelName = schedule.CareLevel.LevelName,
                Description = schedule.CareLevel.Description,
                CareItems = schedule.CareLevel.CareItems,
                ServiceStandards = schedule.CareLevel.ServiceStandards,
                DailyCareHours = schedule.CareLevel.DailyCareHours,
                NurseRatio = schedule.CareLevel.NurseRatio,
                MonthlyFee = schedule.CareLevel.MonthlyFee
            };
        }

        var medications = schedule.Elder?.Medications?.Select(m => new MedicationDto
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

        var reviewRecords = schedule.ReviewRecords?.Select(r => new ReviewRecordDto
        {
            Id = r.Id,
            ReviewType = r.ReviewType,
            ReviewTypeText = EnumHelper.GetReviewTypeText(r.ReviewType),
            ScheduleId = r.ScheduleId,
            ExceptionRecordId = r.ExceptionRecordId,
            ReviewResult = r.ReviewResult,
            ReviewResultText = EnumHelper.GetReviewResultText(r.ReviewResult),
            ReviewComment = r.ReviewComment,
            ImprovementSuggestions = r.ImprovementSuggestions,
            CareStandardRating = r.CareStandardRating,
            CareStandardRatingText = r.CareStandardRating.HasValue ? EnumHelper.GetCareStandardText(r.CareStandardRating.Value) : null,
            Reviewer = r.Reviewer,
            ReviewerDepartment = r.ReviewerDepartment,
            ReviewDueDate = r.ReviewDueDate,
            ReviewedAt = r.ReviewedAt,
            IsFollowUpRequired = r.IsFollowUpRequired,
            FollowUpDueDate = r.FollowUpDueDate,
            FollowUpRequirements = r.FollowUpRequirements,
            FollowUpCompleted = r.FollowUpCompleted
        }).OrderByDescending(r => r.ReviewedAt).ToList() ?? new List<ReviewRecordDto>();

        var exceptionRecords = schedule.ExceptionRecords?.Select(e => new ExceptionRecordListDto
        {
            Id = e.Id,
            ExceptionNo = e.ExceptionNo,
            ScheduleId = e.ScheduleId,
            ScheduleNo = schedule.ScheduleNo,
            ElderId = e.ElderId,
            ElderName = schedule.Elder?.Name ?? string.Empty,
            ExceptionType = e.ExceptionType,
            ExceptionTypeText = EnumHelper.GetExceptionTypeText(e.ExceptionType),
            Severity = e.Severity,
            SeverityText = EnumHelper.GetExceptionSeverityText(e.Severity),
            Status = e.Status,
            StatusText = EnumHelper.GetExceptionStatusText(e.Status),
            CloseType = e.CloseType,
            CloseTypeText = e.CloseType.HasValue ? EnumHelper.GetExceptionCloseTypeText(e.CloseType.Value) : null,
            OccurredAt = e.OccurredAt,
            OccurredLocation = e.OccurredLocation,
            Description = e.Description,
            AssignedTo = e.AssignedTo,
            CreatedAt = e.CreatedAt,
            CreatedBy = e.CreatedBy,
            ClosedAt = e.ClosedAt,
            ClosedBy = e.ClosedBy
        }).OrderByDescending(e => e.CreatedAt).ToList() ?? new List<ExceptionRecordListDto>();

        var statusHistories = schedule.StatusHistories?.Select(h => new ScheduleStatusHistoryDto
        {
            Id = h.Id,
            PreviousStatus = h.PreviousStatus,
            PreviousStatusText = EnumHelper.GetScheduleStatusText(h.PreviousStatus),
            NewStatus = h.NewStatus,
            NewStatusText = EnumHelper.GetScheduleStatusText(h.NewStatus),
            ChangeReason = h.ChangeReason,
            ChangedAt = h.ChangedAt,
            ChangedBy = h.ChangedBy
        }).OrderBy(h => h.ChangedAt).ToList() ?? new List<ScheduleStatusHistoryDto>();

        return new ScheduleDetailDto
        {
            Id = schedule.Id,
            ScheduleNo = schedule.ScheduleNo,
            ElderId = schedule.ElderId,
            Elder = elderDto,
            BedId = schedule.BedId,
            Bed = bedDto,
            CareLevelId = schedule.CareLevelId,
            CareLevel = careLevelDto,
            StartDate = schedule.StartDate,
            EndDate = schedule.EndDate,
            ShiftType = schedule.ShiftType,
            PrimaryNurse = schedule.PrimaryNurse,
            SecondaryNurse = schedule.SecondaryNurse,
            DoctorOnDuty = schedule.DoctorOnDuty,
            CarePlan = schedule.CarePlan,
            SpecialRequirements = schedule.SpecialRequirements,
            NutritionPlan = schedule.NutritionPlan,
            RehabilitationPlan = schedule.RehabilitationPlan,
            DailySchedule = schedule.DailySchedule,
            Status = schedule.Status,
            StatusText = EnumHelper.GetScheduleStatusText(schedule.Status),
            ProcessingNotes = schedule.ProcessingNotes,
            ReviewComments = schedule.ReviewComments,
            PostReviewSummary = schedule.PostReviewSummary,
            CareStandard = schedule.CareStandard,
            Medications = medications,
            ReviewRecords = reviewRecords,
            ExceptionRecords = exceptionRecords,
            StatusHistories = statusHistories,
            CreatedAt = schedule.CreatedAt,
            CreatedBy = schedule.CreatedBy,
            SubmittedAt = schedule.SubmittedAt,
            SubmittedBy = schedule.SubmittedBy,
            ReviewedAt = schedule.ReviewedAt,
            ReviewedBy = schedule.ReviewedBy,
            StartedAt = schedule.StartedAt,
            StartedBy = schedule.StartedBy,
            CompletedAt = schedule.CompletedAt,
            CompletedBy = schedule.CompletedBy,
            PostReviewedAt = schedule.PostReviewedAt,
            PostReviewedBy = schedule.PostReviewedBy,
            ClosedAt = schedule.ClosedAt,
            ClosedBy = schedule.ClosedBy
        };
    }
}
