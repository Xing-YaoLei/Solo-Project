using ElderCareScheduling.API.Enums;
using ElderCareScheduling.API.Models.DTOs;
using ElderCareScheduling.API.Models.Entities;
using ElderCareScheduling.API.Repositories;

namespace ElderCareScheduling.API.Services;

public class ExceptionRecordService : IExceptionRecordService
{
    private readonly IUnitOfWork _unitOfWork;

    public ExceptionRecordService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResultDto<ExceptionRecordListDto>> GetListAsync(ExceptionQueryDto query)
    {
        var pagedResult = await _unitOfWork.ExceptionRecords.GetPagedListAsync(query);

        foreach (var item in pagedResult.Items)
        {
            item.ExceptionTypeText = EnumHelper.GetExceptionTypeText(item.ExceptionType);
            item.SeverityText = EnumHelper.GetExceptionSeverityText(item.Severity);
            item.StatusText = EnumHelper.GetExceptionStatusText(item.Status);
            if (item.CloseType.HasValue)
                item.CloseTypeText = EnumHelper.GetExceptionCloseTypeText(item.CloseType.Value);
        }

        return pagedResult;
    }

    public async Task<ExceptionRecordDetailDto?> GetByIdAsync(Guid id)
    {
        var exception = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        if (exception == null) return null;

        return MapToDetailDto(exception);
    }

    public async Task<ExceptionRecordDetailDto> CreateAsync(CreateExceptionRecordDto dto)
    {
        if (dto.ScheduleId == Guid.Empty)
            throw new ArgumentException("排班ID不能为空");
        if (dto.ElderId == Guid.Empty)
            throw new ArgumentException("老人ID不能为空");
        if (dto.OccurredAt == default)
            throw new ArgumentException("发生时间不能为空");
        if (string.IsNullOrWhiteSpace(dto.Description))
            throw new ArgumentException("异常描述不能为空");

        var schedule = await _unitOfWork.Schedules.GetByIdAsync(dto.ScheduleId);
        if (schedule == null)
            throw new KeyNotFoundException($"未找到ID为 {dto.ScheduleId} 的排班记录");

        var elderExists = await _unitOfWork.Elders.ExistsAsync(e => e.Id == dto.ElderId);
        if (!elderExists)
            throw new KeyNotFoundException($"未找到ID为 {dto.ElderId} 的老人记录");

        var exceptionNo = await _unitOfWork.ExceptionRecords.GenerateExceptionNoAsync();

        var exception = new ExceptionRecord
        {
            Id = Guid.NewGuid(),
            ExceptionNo = exceptionNo,
            ScheduleId = dto.ScheduleId,
            ElderId = dto.ElderId,
            ExceptionType = dto.ExceptionType,
            Severity = dto.Severity,
            Status = ExceptionStatus.Reported,
            OccurredAt = dto.OccurredAt,
            OccurredLocation = dto.OccurredLocation,
            Description = dto.Description,
            FallSceneDescription = dto.FallSceneDescription,
            FallCause = dto.FallCause,
            FallHeight = dto.FallHeight,
            InjuredPart = dto.InjuredPart,
            InitialSymptoms = dto.InitialSymptoms,
            OnSiteMeasures = dto.OnSiteMeasures,
            CreatedAt = DateTime.Now,
            CreatedBy = dto.CreatedBy,
            ReportedAt = DateTime.Now,
            ReportedBy = dto.CreatedBy
        };

        var previousScheduleStatus = schedule.Status;
        schedule.Status = ScheduleStatus.ExceptionOccurred;
        schedule.UpdatedAt = DateTime.Now;
        schedule.UpdatedBy = dto.CreatedBy;

        await _unitOfWork.ExceptionRecords.AddAsync(exception);
        _unitOfWork.Schedules.Update(schedule);

        await AddExceptionStatusHistoryAsync(exception.Id, ExceptionStatus.Reported, ExceptionStatus.Reported, "创建异常记录", dto.CreatedBy);

        await _unitOfWork.CompleteAsync();

        var created = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(exception.Id);
        return MapToDetailDto(created!);
    }

    public async Task<ExceptionRecordDetailDto> UpdateAsync(Guid id, UpdateExceptionRecordDto dto)
    {
        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的异常记录");

        if (exception.Status >= ExceptionStatus.Resolved)
            throw new InvalidOperationException($"当前状态 {EnumHelper.GetExceptionStatusText(exception.Status)} 不允许修改基本信息");

        if (dto.Severity.HasValue) exception.Severity = dto.Severity.Value;
        if (dto.OccurredAt.HasValue) exception.OccurredAt = dto.OccurredAt.Value;
        if (dto.OccurredLocation != null) exception.OccurredLocation = dto.OccurredLocation;
        if (dto.Description != null) exception.Description = dto.Description;
        if (dto.FallSceneDescription != null) exception.FallSceneDescription = dto.FallSceneDescription;
        if (dto.FallCause != null) exception.FallCause = dto.FallCause;
        if (dto.FallHeight != null) exception.FallHeight = dto.FallHeight;
        if (dto.InjuredPart != null) exception.InjuredPart = dto.InjuredPart;
        if (dto.InitialSymptoms != null) exception.InitialSymptoms = dto.InitialSymptoms;
        if (dto.OnSiteMeasures != null) exception.OnSiteMeasures = dto.OnSiteMeasures;
        if (dto.InvestigationResult != null) exception.InvestigationResult = dto.InvestigationResult;
        if (dto.HandlingMeasures != null) exception.HandlingMeasures = dto.HandlingMeasures;
        if (dto.TreatmentResult != null) exception.TreatmentResult = dto.TreatmentResult;
        if (dto.RootCauseAnalysis != null) exception.RootCauseAnalysis = dto.RootCauseAnalysis;
        if (dto.CorrectiveActions != null) exception.CorrectiveActions = dto.CorrectiveActions;
        if (dto.PreventiveMeasures != null) exception.PreventiveMeasures = dto.PreventiveMeasures;
        if (dto.FinalConclusion != null) exception.FinalConclusion = dto.FinalConclusion;
        if (dto.LessonsLearned != null) exception.LessonsLearned = dto.LessonsLearned;

        exception.UpdatedAt = DateTime.Now;
        exception.UpdatedBy = dto.UpdatedBy;

        _unitOfWork.ExceptionRecords.Update(exception);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ExceptionRecordDetailDto> AssignHandlerAsync(Guid id, ExceptionStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");
        if (string.IsNullOrWhiteSpace(dto.AssignedTo))
            throw new ArgumentException("处理人不能为空");

        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的异常记录");

        if (exception.Status != ExceptionStatus.Reported)
            throw new InvalidOperationException($"只有已报告状态可以指派处理人，当前状态：{EnumHelper.GetExceptionStatusText(exception.Status)}");

        var previousStatus = exception.Status;
        exception.Status = ExceptionStatus.Investigating;
        exception.AssignedTo = dto.AssignedTo;
        exception.AssignedAt = DateTime.Now;
        exception.AssignedBy = dto.Operator;
        exception.UpdatedAt = DateTime.Now;
        exception.UpdatedBy = dto.Operator;

        await AddExceptionStatusHistoryAsync(exception.Id, previousStatus, exception.Status, dto.ChangeReason ?? $"指派处理人：{dto.AssignedTo}", dto.Operator);

        _unitOfWork.ExceptionRecords.Update(exception);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ExceptionRecordDetailDto> StartInvestigationAsync(Guid id, ExceptionStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");
        if (string.IsNullOrWhiteSpace(dto.Investigator))
            throw new ArgumentException("调查人不能为空");

        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的异常记录");

        if (exception.Status != ExceptionStatus.Investigating)
            throw new InvalidOperationException($"只有调查中状态可以设置调查人，当前状态：{EnumHelper.GetExceptionStatusText(exception.Status)}");

        exception.Investigator = dto.Investigator;
        exception.InvestigationStartedAt = DateTime.Now;
        exception.UpdatedAt = DateTime.Now;
        exception.UpdatedBy = dto.Operator;

        await AddExceptionStatusHistoryAsync(exception.Id, exception.Status, exception.Status, dto.ChangeReason ?? $"设置调查人：{dto.Investigator}", dto.Operator);

        _unitOfWork.ExceptionRecords.Update(exception);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ExceptionRecordDetailDto> StartHandlingAsync(Guid id, ExceptionStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");

        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的异常记录");

        if (exception.Status != ExceptionStatus.Investigating)
            throw new InvalidOperationException($"只有调查中状态可以开始处理，当前状态：{EnumHelper.GetExceptionStatusText(exception.Status)}");

        var previousStatus = exception.Status;
        exception.Status = ExceptionStatus.Handling;
        exception.UpdatedAt = DateTime.Now;
        exception.UpdatedBy = dto.Operator;

        await AddExceptionStatusHistoryAsync(exception.Id, previousStatus, exception.Status, dto.ChangeReason ?? "开始处理", dto.Operator);

        _unitOfWork.ExceptionRecords.Update(exception);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ExceptionRecordDetailDto> ResolveAsync(Guid id, ExceptionStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");

        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的异常记录");

        if (exception.Status != ExceptionStatus.Handling)
            throw new InvalidOperationException($"只有处理中状态可以解决，当前状态：{EnumHelper.GetExceptionStatusText(exception.Status)}");

        var previousStatus = exception.Status;
        exception.Status = ExceptionStatus.Resolved;
        exception.ResolvedAt = DateTime.Now;
        exception.ResolvedBy = dto.Operator;
        exception.UpdatedAt = DateTime.Now;
        exception.UpdatedBy = dto.Operator;

        await AddExceptionStatusHistoryAsync(exception.Id, previousStatus, exception.Status, dto.ChangeReason ?? "异常已解决", dto.Operator);

        _unitOfWork.ExceptionRecords.Update(exception);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ExceptionRecordDetailDto> RequestSupplementAsync(Guid id, ExceptionStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");
        if (string.IsNullOrWhiteSpace(dto.SupplementRequirement))
            throw new ArgumentException("补充要求不能为空");

        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的异常记录");

        if (exception.Status != ExceptionStatus.Handling)
            throw new InvalidOperationException($"只有处理中状态可以请求补充材料，当前状态：{EnumHelper.GetExceptionStatusText(exception.Status)}");

        var previousStatus = exception.Status;
        exception.Status = ExceptionStatus.PendingSupplement;
        exception.SupplementRequirement = dto.SupplementRequirement;
        exception.SupplementDueDate = dto.SupplementDueDate;
        exception.SupplementReceived = false;
        exception.UpdatedAt = DateTime.Now;
        exception.UpdatedBy = dto.Operator;

        await AddExceptionStatusHistoryAsync(exception.Id, previousStatus, exception.Status, dto.ChangeReason ?? $"请求补充材料：{dto.SupplementRequirement}", dto.Operator);

        _unitOfWork.ExceptionRecords.Update(exception);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ExceptionRecordDetailDto> SubmitSupplementAsync(Guid id, ExceptionStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");

        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的异常记录");

        if (exception.Status != ExceptionStatus.PendingSupplement)
            throw new InvalidOperationException($"只有待补充材料状态可以提交补充，当前状态：{EnumHelper.GetExceptionStatusText(exception.Status)}");

        var previousStatus = exception.Status;
        exception.Status = ExceptionStatus.Handling;
        exception.SupplementReceived = dto.SupplementReceived ?? true;
        exception.SupplementReceivedAt = DateTime.Now;
        exception.SupplementReceivedBy = dto.Operator;
        if (!string.IsNullOrWhiteSpace(dto.SupplementMaterialDescription))
            exception.SupplementMaterialDescription = dto.SupplementMaterialDescription;
        exception.UpdatedAt = DateTime.Now;
        exception.UpdatedBy = dto.Operator;

        await AddExceptionStatusHistoryAsync(exception.Id, previousStatus, exception.Status, dto.ChangeReason ?? "补充材料已接收", dto.Operator);

        _unitOfWork.ExceptionRecords.Update(exception);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ExceptionRecordDetailDto> EscalateAsync(Guid id, ExceptionStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");
        if (string.IsNullOrWhiteSpace(dto.EscalationReason))
            throw new ArgumentException("升级原因不能为空");
        if (string.IsNullOrWhiteSpace(dto.EscalatedTo))
            throw new ArgumentException("升级对象不能为空");

        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的异常记录");

        var closedStatuses = new[] { ExceptionStatus.ClosedNormal, ExceptionStatus.ClosedWithSupplement, ExceptionStatus.ClosedEscalated };
        if (closedStatuses.Contains(exception.Status))
            throw new InvalidOperationException($"异常已关闭，无法升级，当前状态：{EnumHelper.GetExceptionStatusText(exception.Status)}");

        var previousStatus = exception.Status;
        exception.Status = ExceptionStatus.Escalated;
        exception.EscalationReason = dto.EscalationReason;
        exception.EscalatedAt = DateTime.Now;
        exception.EscalatedBy = dto.Operator;
        exception.EscalatedTo = dto.EscalatedTo;
        if (!string.IsNullOrWhiteSpace(dto.EscalationResponse))
            exception.EscalationResponse = dto.EscalationResponse;
        exception.UpdatedAt = DateTime.Now;
        exception.UpdatedBy = dto.Operator;

        await AddExceptionStatusHistoryAsync(exception.Id, previousStatus, exception.Status, dto.ChangeReason ?? $"升级至 {dto.EscalatedTo}：{dto.EscalationReason}", dto.Operator);

        _unitOfWork.ExceptionRecords.Update(exception);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ExceptionRecordDetailDto> CloseNormalAsync(Guid id, ExceptionStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");

        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的异常记录");

        if (exception.Status != ExceptionStatus.Resolved)
            throw new InvalidOperationException($"只有已解决状态可以正常关闭，当前状态：{EnumHelper.GetExceptionStatusText(exception.Status)}");

        var previousStatus = exception.Status;
        exception.Status = ExceptionStatus.ClosedNormal;
        exception.CloseType = ExceptionCloseType.NormalClose;
        exception.ClosedAt = DateTime.Now;
        exception.ClosedBy = dto.Operator;
        exception.UpdatedAt = DateTime.Now;
        exception.UpdatedBy = dto.Operator;

        await AddExceptionStatusHistoryAsync(exception.Id, previousStatus, exception.Status, dto.ChangeReason ?? "正常关闭", dto.Operator);

        _unitOfWork.ExceptionRecords.Update(exception);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ExceptionRecordDetailDto> CloseWithSupplementAsync(Guid id, ExceptionStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");

        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的异常记录");

        if (exception.Status != ExceptionStatus.Resolved)
            throw new InvalidOperationException($"只有已解决状态可以关闭（需补充），当前状态：{EnumHelper.GetExceptionStatusText(exception.Status)}");

        var previousStatus = exception.Status;
        exception.Status = ExceptionStatus.ClosedWithSupplement;
        exception.CloseType = ExceptionCloseType.SupplementRequired;
        if (!string.IsNullOrWhiteSpace(dto.SupplementRequirement))
            exception.SupplementRequirement = dto.SupplementRequirement;
        exception.ClosedAt = DateTime.Now;
        exception.ClosedBy = dto.Operator;
        exception.UpdatedAt = DateTime.Now;
        exception.UpdatedBy = dto.Operator;

        await AddExceptionStatusHistoryAsync(exception.Id, previousStatus, exception.Status, dto.ChangeReason ?? "关闭（需后续补充材料）", dto.Operator);

        _unitOfWork.ExceptionRecords.Update(exception);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ExceptionRecordDetailDto> CloseEscalatedAsync(Guid id, ExceptionStatusChangeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Operator))
            throw new ArgumentException("操作人不能为空");

        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {id} 的异常记录");

        if (exception.Status != ExceptionStatus.Escalated && exception.Status != ExceptionStatus.Resolved)
            throw new InvalidOperationException($"只有已升级或已解决状态可以按升级方式关闭，当前状态：{EnumHelper.GetExceptionStatusText(exception.Status)}");

        var previousStatus = exception.Status;
        exception.Status = ExceptionStatus.ClosedEscalated;
        exception.CloseType = ExceptionCloseType.Escalation;
        if (!string.IsNullOrWhiteSpace(dto.EscalationResponse))
            exception.EscalationResponse = dto.EscalationResponse;
        exception.ClosedAt = DateTime.Now;
        exception.ClosedBy = dto.Operator;
        exception.UpdatedAt = DateTime.Now;
        exception.UpdatedBy = dto.Operator;

        await AddExceptionStatusHistoryAsync(exception.Id, previousStatus, exception.Status, dto.ChangeReason ?? "升级处理后关闭", dto.Operator);

        _unitOfWork.ExceptionRecords.Update(exception);
        await _unitOfWork.CompleteAsync();

        var updated = await _unitOfWork.ExceptionRecords.GetWithFullDetailsAsync(id);
        return MapToDetailDto(updated!);
    }

    public async Task<ExceptionAttachmentDto> AddAttachmentAsync(Guid exceptionId, ExceptionAttachmentDto dto)
    {
        if (exceptionId == Guid.Empty)
            throw new ArgumentException("异常记录ID不能为空");
        if (string.IsNullOrWhiteSpace(dto.FileName))
            throw new ArgumentException("文件名不能为空");

        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(exceptionId);
        if (exception == null)
            throw new KeyNotFoundException($"未找到ID为 {exceptionId} 的异常记录");

        var attachment = new ExceptionAttachment
        {
            Id = Guid.NewGuid(),
            ExceptionRecordId = exceptionId,
            FileName = dto.FileName,
            FileType = dto.FileType,
            FilePath = dto.FilePath,
            FileSize = dto.FileSize,
            Description = dto.Description,
            AttachmentCategory = dto.AttachmentCategory,
            CreatedAt = DateTime.Now,
            CreatedBy = dto.CreatedBy
        };

        await _unitOfWork.ExceptionRecords.AddAttachmentAsync(attachment);
        await _unitOfWork.CompleteAsync();

        return new ExceptionAttachmentDto
        {
            Id = attachment.Id,
            ExceptionRecordId = attachment.ExceptionRecordId,
            FileName = attachment.FileName,
            FileType = attachment.FileType,
            FilePath = attachment.FilePath,
            FileSize = attachment.FileSize,
            Description = attachment.Description,
            AttachmentCategory = attachment.AttachmentCategory,
            CreatedAt = attachment.CreatedAt,
            CreatedBy = attachment.CreatedBy
        };
    }

    private async Task AddExceptionStatusHistoryAsync(Guid exceptionId, ExceptionStatus previousStatus, ExceptionStatus newStatus, string changeReason, string changedBy)
    {
        var history = new ExceptionStatusHistory
        {
            Id = Guid.NewGuid(),
            ExceptionRecordId = exceptionId,
            PreviousStatus = previousStatus,
            NewStatus = newStatus,
            ChangeReason = changeReason,
            ChangedAt = DateTime.Now,
            ChangedBy = changedBy
        };

        await _unitOfWork.ExceptionRecords.AddStatusHistoryAsync(history);
    }

    private ExceptionRecordDetailDto MapToDetailDto(ExceptionRecord exception)
    {
        ElderDetailDto? elderDto = null;
        if (exception.Elder != null)
        {
            CareLevelDto? elderCareLevelDto = null;
            if (exception.Elder.CareLevel != null)
            {
                elderCareLevelDto = new CareLevelDto
                {
                    Id = exception.Elder.CareLevel.Id,
                    LevelType = exception.Elder.CareLevel.LevelType,
                    LevelTypeText = EnumHelper.GetCareLevelTypeText(exception.Elder.CareLevel.LevelType),
                    LevelName = exception.Elder.CareLevel.LevelName,
                    Description = exception.Elder.CareLevel.Description,
                    CareItems = exception.Elder.CareLevel.CareItems,
                    ServiceStandards = exception.Elder.CareLevel.ServiceStandards,
                    DailyCareHours = exception.Elder.CareLevel.DailyCareHours,
                    NurseRatio = exception.Elder.CareLevel.NurseRatio,
                    MonthlyFee = exception.Elder.CareLevel.MonthlyFee
                };
            }

            var elderMedications = exception.Elder.Medications?.Select(m => new MedicationDto
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
                Id = exception.Elder.Id,
                Name = exception.Elder.Name,
                Gender = exception.Elder.Gender,
                GenderText = EnumHelper.GetGenderText(exception.Elder.Gender),
                DateOfBirth = exception.Elder.DateOfBirth,
                Age = exception.Elder.Age,
                IdCardNumber = exception.Elder.IdCardNumber,
                PhoneNumber = exception.Elder.PhoneNumber,
                EmergencyContact = exception.Elder.EmergencyContact,
                EmergencyPhone = exception.Elder.EmergencyPhone,
                Address = exception.Elder.Address,
                MedicalHistory = exception.Elder.MedicalHistory,
                AllergyInfo = exception.Elder.AllergyInfo,
                DietaryRequirements = exception.Elder.DietaryRequirements,
                Notes = exception.Elder.Notes,
                SourceType = exception.Elder.SourceType,
                SourceTypeText = EnumHelper.GetSourceTypeText(exception.Elder.SourceType),
                SourceDetail = exception.Elder.SourceDetail,
                CareLevelId = exception.Elder.CareLevelId,
                CareLevel = elderCareLevelDto,
                Medications = elderMedications,
                IsActive = exception.Elder.IsActive,
                CreatedAt = exception.Elder.CreatedAt,
                CreatedBy = exception.Elder.CreatedBy
            };
        }

        var reviewRecords = exception.ReviewRecords?.Select(r => new ReviewRecordDto
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

        var attachments = exception.Attachments?.Select(a => new ExceptionAttachmentDto
        {
            Id = a.Id,
            ExceptionRecordId = a.ExceptionRecordId,
            FileName = a.FileName,
            FileType = a.FileType,
            FilePath = a.FilePath,
            FileSize = a.FileSize,
            Description = a.Description,
            AttachmentCategory = a.AttachmentCategory,
            CreatedAt = a.CreatedAt,
            CreatedBy = a.CreatedBy
        }).OrderBy(a => a.CreatedAt).ToList() ?? new List<ExceptionAttachmentDto>();

        var statusHistories = exception.StatusHistories?.Select(h => new ExceptionStatusHistoryDto
        {
            Id = h.Id,
            PreviousStatus = h.PreviousStatus,
            PreviousStatusText = EnumHelper.GetExceptionStatusText(h.PreviousStatus),
            NewStatus = h.NewStatus,
            NewStatusText = EnumHelper.GetExceptionStatusText(h.NewStatus),
            ChangeReason = h.ChangeReason,
            ChangedAt = h.ChangedAt,
            ChangedBy = h.ChangedBy
        }).OrderBy(h => h.ChangedAt).ToList() ?? new List<ExceptionStatusHistoryDto>();

        return new ExceptionRecordDetailDto
        {
            Id = exception.Id,
            ExceptionNo = exception.ExceptionNo,
            ScheduleId = exception.ScheduleId,
            ScheduleNo = exception.Schedule?.ScheduleNo,
            ElderId = exception.ElderId,
            Elder = elderDto,
            ExceptionType = exception.ExceptionType,
            ExceptionTypeText = EnumHelper.GetExceptionTypeText(exception.ExceptionType),
            Severity = exception.Severity,
            SeverityText = EnumHelper.GetExceptionSeverityText(exception.Severity),
            Status = exception.Status,
            StatusText = EnumHelper.GetExceptionStatusText(exception.Status),
            CloseType = exception.CloseType,
            CloseTypeText = exception.CloseType.HasValue ? EnumHelper.GetExceptionCloseTypeText(exception.CloseType.Value) : null,
            OccurredAt = exception.OccurredAt,
            OccurredLocation = exception.OccurredLocation,
            Description = exception.Description,
            FallSceneDescription = exception.FallSceneDescription,
            FallCause = exception.FallCause,
            FallHeight = exception.FallHeight,
            InjuredPart = exception.InjuredPart,
            InitialSymptoms = exception.InitialSymptoms,
            OnSiteMeasures = exception.OnSiteMeasures,
            InvestigationResult = exception.InvestigationResult,
            HandlingMeasures = exception.HandlingMeasures,
            TreatmentResult = exception.TreatmentResult,
            RootCauseAnalysis = exception.RootCauseAnalysis,
            CorrectiveActions = exception.CorrectiveActions,
            PreventiveMeasures = exception.PreventiveMeasures,
            SupplementMaterialDescription = exception.SupplementMaterialDescription,
            SupplementRequirement = exception.SupplementRequirement,
            SupplementDueDate = exception.SupplementDueDate,
            SupplementReceived = exception.SupplementReceived,
            SupplementReceivedAt = exception.SupplementReceivedAt,
            SupplementReceivedBy = exception.SupplementReceivedBy,
            EscalationReason = exception.EscalationReason,
            EscalatedAt = exception.EscalatedAt,
            EscalatedBy = exception.EscalatedBy,
            EscalatedTo = exception.EscalatedTo,
            EscalationResponse = exception.EscalationResponse,
            FinalConclusion = exception.FinalConclusion,
            LessonsLearned = exception.LessonsLearned,
            ReviewRecords = reviewRecords,
            Attachments = attachments,
            StatusHistories = statusHistories,
            CreatedAt = exception.CreatedAt,
            CreatedBy = exception.CreatedBy,
            ReportedAt = exception.ReportedAt,
            ReportedBy = exception.ReportedBy,
            AssignedAt = exception.AssignedAt,
            AssignedTo = exception.AssignedTo,
            AssignedBy = exception.AssignedBy,
            InvestigationStartedAt = exception.InvestigationStartedAt,
            Investigator = exception.Investigator,
            ResolvedAt = exception.ResolvedAt,
            ResolvedBy = exception.ResolvedBy,
            ClosedAt = exception.ClosedAt,
            ClosedBy = exception.ClosedBy
        };
    }
}
