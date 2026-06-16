using ElderCareScheduling.API.Enums;
using ElderCareScheduling.API.Models.Entities;

namespace ElderCareScheduling.API.Models.DTOs;

public class ScheduleListDto
{
    public Guid Id { get; set; }
    public string ScheduleNo { get; set; } = string.Empty;
    public Guid ElderId { get; set; }
    public string ElderName { get; set; } = string.Empty;
    public int ElderAge { get; set; }
    public string? CareLevelName { get; set; }
    public string? BedNumber { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public ShiftType ShiftType { get; set; }
    public string? PrimaryNurse { get; set; }
    public ScheduleStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public CareStandard CareStandard { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public bool HasExceptions { get; set; }
    public int ExceptionCount { get; set; }
}

public class ScheduleDetailDto
{
    public Guid Id { get; set; }
    public string ScheduleNo { get; set; } = string.Empty;
    public Guid ElderId { get; set; }
    public ElderDetailDto Elder { get; set; } = new();
    public Guid? BedId { get; set; }
    public BedDto? Bed { get; set; }
    public Guid? CareLevelId { get; set; }
    public CareLevelDto? CareLevel { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public ShiftType ShiftType { get; set; }
    public string? PrimaryNurse { get; set; }
    public string? SecondaryNurse { get; set; }
    public string? DoctorOnDuty { get; set; }
    public string? CarePlan { get; set; }
    public string? SpecialRequirements { get; set; }
    public string? NutritionPlan { get; set; }
    public string? RehabilitationPlan { get; set; }
    public string? DailySchedule { get; set; }
    public ScheduleStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public string? ProcessingNotes { get; set; }
    public string? ReviewComments { get; set; }
    public string? PostReviewSummary { get; set; }
    public CareStandard CareStandard { get; set; }
    public List<MedicationDto> Medications { get; set; } = new();
    public List<ReviewRecordDto> ReviewRecords { get; set; } = new();
    public List<ExceptionRecordListDto> ExceptionRecords { get; set; } = new();
    public List<ScheduleStatusHistoryDto> StatusHistories { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? SubmittedAt { get; set; }
    public string? SubmittedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedBy { get; set; }
    public DateTime? StartedAt { get; set; }
    public string? StartedBy { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? CompletedBy { get; set; }
    public DateTime? PostReviewedAt { get; set; }
    public string? PostReviewedBy { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? ClosedBy { get; set; }
}

public class CreateScheduleDto
{
    public Guid ElderId { get; set; }
    public Guid? BedId { get; set; }
    public Guid? CareLevelId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public ShiftType ShiftType { get; set; }
    public string? PrimaryNurse { get; set; }
    public string? SecondaryNurse { get; set; }
    public string? DoctorOnDuty { get; set; }
    public string? CarePlan { get; set; }
    public string? SpecialRequirements { get; set; }
    public string? NutritionPlan { get; set; }
    public string? RehabilitationPlan { get; set; }
    public string? DailySchedule { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

public class UpdateScheduleDto
{
    public Guid? BedId { get; set; }
    public Guid? CareLevelId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public ShiftType? ShiftType { get; set; }
    public string? PrimaryNurse { get; set; }
    public string? SecondaryNurse { get; set; }
    public string? DoctorOnDuty { get; set; }
    public string? CarePlan { get; set; }
    public string? SpecialRequirements { get; set; }
    public string? NutritionPlan { get; set; }
    public string? RehabilitationPlan { get; set; }
    public string? DailySchedule { get; set; }
    public string? ProcessingNotes { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
}

public class ScheduleStatusChangeDto
{
    public ScheduleStatus NewStatus { get; set; }
    public string? ChangeReason { get; set; }
    public string? ReviewComments { get; set; }
    public ReviewResult? ReviewResult { get; set; }
    public CareStandard? CareStandard { get; set; }
    public string? PostReviewSummary { get; set; }
    public string Operator { get; set; } = string.Empty;
}

public class ScheduleStatusHistoryDto
{
    public Guid Id { get; set; }
    public ScheduleStatus PreviousStatus { get; set; }
    public string PreviousStatusText { get; set; } = string.Empty;
    public ScheduleStatus NewStatus { get; set; }
    public string NewStatusText { get; set; } = string.Empty;
    public string? ChangeReason { get; set; }
    public DateTime ChangedAt { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
}

public class ScheduleQueryDto
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Keyword { get; set; }
    public ScheduleStatus? Status { get; set; }
    public Guid? ElderId { get; set; }
    public Guid? CareLevelId { get; set; }
    public DateTime? StartDateFrom { get; set; }
    public DateTime? StartDateTo { get; set; }
    public string? PrimaryNurse { get; set; }
    public bool? HasExceptions { get; set; }
    public CareStandard? CareStandard { get; set; }
}

public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
