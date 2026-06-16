using ElderCareScheduling.API.Enums;

namespace ElderCareScheduling.API.Models.DTOs;

public class ExceptionRecordListDto
{
    public Guid Id { get; set; }
    public string ExceptionNo { get; set; } = string.Empty;
    public Guid ScheduleId { get; set; }
    public string? ScheduleNo { get; set; }
    public Guid ElderId { get; set; }
    public string ElderName { get; set; } = string.Empty;
    public ExceptionType ExceptionType { get; set; }
    public string ExceptionTypeText { get; set; } = string.Empty;
    public ExceptionSeverity Severity { get; set; }
    public string SeverityText { get; set; } = string.Empty;
    public ExceptionStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public ExceptionCloseType? CloseType { get; set; }
    public string? CloseTypeText { get; set; }
    public DateTime OccurredAt { get; set; }
    public string? OccurredLocation { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? AssignedTo { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? ClosedAt { get; set; }
    public string? ClosedBy { get; set; }
}

public class ExceptionRecordDetailDto
{
    public Guid Id { get; set; }
    public string ExceptionNo { get; set; } = string.Empty;
    public Guid ScheduleId { get; set; }
    public string? ScheduleNo { get; set; }
    public Guid ElderId { get; set; }
    public ElderDetailDto? Elder { get; set; }
    public ExceptionType ExceptionType { get; set; } = ExceptionType.Fall;
    public string ExceptionTypeText { get; set; } = string.Empty;
    public ExceptionSeverity Severity { get; set; }
    public string SeverityText { get; set; } = string.Empty;
    public ExceptionStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public ExceptionCloseType? CloseType { get; set; }
    public string? CloseTypeText { get; set; }
    public DateTime OccurredAt { get; set; }
    public string? OccurredLocation { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? FallSceneDescription { get; set; }
    public string? FallCause { get; set; }
    public string? FallHeight { get; set; }
    public string? InjuredPart { get; set; }
    public string? InitialSymptoms { get; set; }
    public string? OnSiteMeasures { get; set; }
    public string? InvestigationResult { get; set; }
    public string? HandlingMeasures { get; set; }
    public string? TreatmentResult { get; set; }
    public string? RootCauseAnalysis { get; set; }
    public string? CorrectiveActions { get; set; }
    public string? PreventiveMeasures { get; set; }
    public string? SupplementMaterialDescription { get; set; }
    public string? SupplementRequirement { get; set; }
    public DateTime? SupplementDueDate { get; set; }
    public bool SupplementReceived { get; set; }
    public DateTime? SupplementReceivedAt { get; set; }
    public string? SupplementReceivedBy { get; set; }
    public string? EscalationReason { get; set; }
    public DateTime? EscalatedAt { get; set; }
    public string? EscalatedBy { get; set; }
    public string? EscalatedTo { get; set; }
    public string? EscalationResponse { get; set; }
    public string? FinalConclusion { get; set; }
    public string? LessonsLearned { get; set; }
    public List<ReviewRecordDto> ReviewRecords { get; set; } = new();
    public List<ExceptionAttachmentDto> Attachments { get; set; } = new();
    public List<ExceptionStatusHistoryDto> StatusHistories { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? ReportedAt { get; set; }
    public string? ReportedBy { get; set; }
    public DateTime? AssignedAt { get; set; }
    public string? AssignedTo { get; set; }
    public string? AssignedBy { get; set; }
    public DateTime? InvestigationStartedAt { get; set; }
    public string? Investigator { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }
    public DateTime? ClosedAt { get; set; }
    public string? ClosedBy { get; set; }
}

public class CreateExceptionRecordDto
{
    public Guid ScheduleId { get; set; }
    public Guid ElderId { get; set; }
    public ExceptionType ExceptionType { get; set; } = ExceptionType.Fall;
    public ExceptionSeverity Severity { get; set; }
    public DateTime OccurredAt { get; set; }
    public string? OccurredLocation { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? FallSceneDescription { get; set; }
    public string? FallCause { get; set; }
    public string? FallHeight { get; set; }
    public string? InjuredPart { get; set; }
    public string? InitialSymptoms { get; set; }
    public string? OnSiteMeasures { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

public class UpdateExceptionRecordDto
{
    public ExceptionSeverity? Severity { get; set; }
    public DateTime? OccurredAt { get; set; }
    public string? OccurredLocation { get; set; }
    public string? Description { get; set; }
    public string? FallSceneDescription { get; set; }
    public string? FallCause { get; set; }
    public string? FallHeight { get; set; }
    public string? InjuredPart { get; set; }
    public string? InitialSymptoms { get; set; }
    public string? OnSiteMeasures { get; set; }
    public string? InvestigationResult { get; set; }
    public string? HandlingMeasures { get; set; }
    public string? TreatmentResult { get; set; }
    public string? RootCauseAnalysis { get; set; }
    public string? CorrectiveActions { get; set; }
    public string? PreventiveMeasures { get; set; }
    public string? FinalConclusion { get; set; }
    public string? LessonsLearned { get; set; }
    public string UpdatedBy { get; set; } = string.Empty;
}

public class ExceptionStatusChangeDto
{
    public ExceptionStatus NewStatus { get; set; }
    public string? ChangeReason { get; set; }
    public ExceptionCloseType? CloseType { get; set; }
    public string? SupplementRequirement { get; set; }
    public DateTime? SupplementDueDate { get; set; }
    public string? SupplementMaterialDescription { get; set; }
    public bool? SupplementReceived { get; set; }
    public string? EscalationReason { get; set; }
    public string? EscalatedTo { get; set; }
    public string? EscalationResponse { get; set; }
    public string? AssignedTo { get; set; }
    public string? Investigator { get; set; }
    public string Operator { get; set; } = string.Empty;
}

public class ExceptionStatusHistoryDto
{
    public Guid Id { get; set; }
    public ExceptionStatus PreviousStatus { get; set; }
    public string PreviousStatusText { get; set; } = string.Empty;
    public ExceptionStatus NewStatus { get; set; }
    public string NewStatusText { get; set; } = string.Empty;
    public string? ChangeReason { get; set; }
    public DateTime ChangedAt { get; set; }
    public string ChangedBy { get; set; } = string.Empty;
}

public class ExceptionAttachmentDto
{
    public Guid Id { get; set; }
    public Guid ExceptionRecordId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public string? FilePath { get; set; }
    public long? FileSize { get; set; }
    public string? Description { get; set; }
    public string? AttachmentCategory { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}

public class ExceptionQueryDto
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Keyword { get; set; }
    public ExceptionType? ExceptionType { get; set; }
    public ExceptionSeverity? Severity { get; set; }
    public ExceptionStatus? Status { get; set; }
    public ExceptionCloseType? CloseType { get; set; }
    public Guid? ElderId { get; set; }
    public Guid? ScheduleId { get; set; }
    public DateTime? OccurredFrom { get; set; }
    public DateTime? OccurredTo { get; set; }
    public string? AssignedTo { get; set; }
    public bool? IncludeClosed { get; set; } = true;
}

public class StatisticsDto
{
    public ScheduleStatisticsDto ScheduleStatistics { get; set; } = new();
    public ExceptionStatisticsDto ExceptionStatistics { get; set; } = new();
    public CareStandardStatisticsDto CareStandardStatistics { get; set; } = new();
    public SourceStatisticsDto SourceStatistics { get; set; } = new();
    public HandlerStatisticsDto HandlerStatistics { get; set; } = new();
    public ExceptionCauseStatisticsDto ExceptionCauseStatistics { get; set; } = new();
}

public class ScheduleStatisticsDto
{
    public int TotalCount { get; set; }
    public int DraftCount { get; set; }
    public int UnderReviewCount { get; set; }
    public int InProgressCount { get; set; }
    public int ExceptionOccurredCount { get; set; }
    public int CompletedCount { get; set; }
    public int ClosedCount { get; set; }
    public List<ScheduleStatusCountItem> StatusBreakdown { get; set; } = new();
    public List<DailyScheduleCountItem> DailyTrend { get; set; } = new();
}

public class ScheduleStatusCountItem
{
    public ScheduleStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class DailyScheduleCountItem
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
}

public class ExceptionStatisticsDto
{
    public int TotalCount { get; set; }
    public int FallCount { get; set; }
    public int OpenCount { get; set; }
    public int ClosedNormalCount { get; set; }
    public int ClosedWithSupplementCount { get; set; }
    public int ClosedEscalatedCount { get; set; }
    public List<ExceptionSeverityCountItem> SeverityBreakdown { get; set; } = new();
    public List<ExceptionTypeCountItem> TypeBreakdown { get; set; } = new();
    public List<DailyExceptionCountItem> DailyTrend { get; set; } = new();
}

public class ExceptionSeverityCountItem
{
    public ExceptionSeverity Severity { get; set; }
    public string SeverityText { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class ExceptionTypeCountItem
{
    public ExceptionType Type { get; set; }
    public string TypeText { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class DailyExceptionCountItem
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
}

public class CareStandardStatisticsDto
{
    public int TotalEvaluated { get; set; }
    public int BelowStandardCount { get; set; }
    public int MeetsStandardCount { get; set; }
    public int ExceedsStandardCount { get; set; }
    public List<CareStandardCountItem> Breakdown { get; set; } = new();
}

public class CareStandardCountItem
{
    public CareStandard Standard { get; set; }
    public string StandardText { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class SourceStatisticsDto
{
    public int TotalElders { get; set; }
    public List<SourceCountItem> Breakdown { get; set; } = new();
}

public class SourceCountItem
{
    public SourceType Source { get; set; }
    public string SourceText { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class HandlerStatisticsDto
{
    public List<HandlerCountItem> TopHandlers { get; set; } = new();
    public List<HandlerEfficiencyItem> HandlerEfficiency { get; set; } = new();
}

public class HandlerCountItem
{
    public string HandlerName { get; set; } = string.Empty;
    public int TotalProcessed { get; set; }
    public int ExceptionHandled { get; set; }
}

public class HandlerEfficiencyItem
{
    public string HandlerName { get; set; } = string.Empty;
    public int TotalCases { get; set; }
    public int ClosedCases { get; set; }
    public double AverageHandlingHours { get; set; }
    public decimal ClosureRate { get; set; }
}

public class ExceptionCauseStatisticsDto
{
    public List<FallCauseCountItem> TopFallCauses { get; set; } = new();
    public List<FallLocationCountItem> FallLocationBreakdown { get; set; } = new();
    public List<FallInjuryCountItem> InjuryPartBreakdown { get; set; } = new();
}

public class FallCauseCountItem
{
    public string Cause { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class FallLocationCountItem
{
    public string Location { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class FallInjuryCountItem
{
    public string BodyPart { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class StatisticsQueryDto
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public Guid? CareLevelId { get; set; }
    public string? HandlerName { get; set; }
}
