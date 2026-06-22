using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.API.DTOs;

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public string? ErrorCode { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null)
        => new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message, string? errorCode = null)
        => new() { Success = false, Message = message, ErrorCode = errorCode };
}

public class BulkOperationDto
{
    public IEnumerable<long> Ids { get; set; } = Enumerable.Empty<long>();
    public int TargetStatus { get; set; }
    public string? Remarks { get; set; }
}

#region Schedule DTOs
public class ScheduleCreateDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public long RegulationId { get; set; }
    public long AuditorId { get; set; }
    public long? BusinessOwnerId { get; set; }
    public int Frequency { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime DueDate { get; set; }
    public int RiskLevel { get; set; }
    public string? Scope { get; set; }
    public string? Remarks { get; set; }
}

public class ScheduleUpdateDto : ScheduleCreateDto
{
    public long Id { get; set; }
}

public class ScheduleQueryDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public long? AuditorId { get; set; }
    public long? BusinessOwnerId { get; set; }
    public int? Status { get; set; }
    public int? RiskLevel { get; set; }
    public DateTime? StartDateFrom { get; set; }
    public DateTime? StartDateTo { get; set; }
    public string? Keyword { get; set; }
}

public class ScheduleListDto
{
    public long Id { get; set; }
    public string ScheduleNo { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public long RegulationId { get; set; }
    public string RegulationName { get; set; } = string.Empty;
    public long AuditorId { get; set; }
    public string AuditorName { get; set; } = string.Empty;
    public long? BusinessOwnerId { get; set; }
    public string? BusinessOwnerName { get; set; }
    public int Frequency { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public DateTime DueDate { get; set; }
    public int RiskLevel { get; set; }
    public int Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ScheduleDetailDto : ScheduleListDto
{
    public string? Description { get; set; }
    public string? Scope { get; set; }
    public string? Remarks { get; set; }
    public int ChecklistItemCount { get; set; }
    public int SamplingRecordCount { get; set; }
    public int CheckRecordCount { get; set; }
    public int RectificationCount { get; set; }
}

public class ScheduleReviewDto
{
    public long Id { get; set; }
    public bool Approved { get; set; }
    public string Comments { get; set; } = string.Empty;
}
#endregion

#region Checklist DTOs
public class ChecklistGenerateDto
{
    public long ScheduleId { get; set; }
    public long TemplateId { get; set; }
}

public class ChecklistItemUpdateDto
{
    public long Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public int RiskLevel { get; set; }
    public string? EvidenceRequirements { get; set; }
    public bool? IsCompliant { get; set; }
    public string? Findings { get; set; }
    public string? AuditNotes { get; set; }
    public int Status { get; set; }
    public int EvidenceStatus { get; set; }
}

public class ChecklistItemResultDto
{
    public long ItemId { get; set; }
    public bool IsCompliant { get; set; }
    public string? Findings { get; set; }
}

public class ChecklistItemDto
{
    public long Id { get; set; }
    public long ScheduleId { get; set; }
    public string ItemNo { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int RiskLevel { get; set; }
    public string? EvidenceRequirements { get; set; }
    public int SortOrder { get; set; }
    public int Status { get; set; }
    public bool? IsCompliant { get; set; }
    public string? Findings { get; set; }
    public string? AuditNotes { get; set; }
    public DateTime? CheckedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public int EvidenceStatus { get; set; }
    public int EvidenceCount { get; set; }
}
#endregion

#region Sampling DTOs
public class SamplingCreateDto
{
    public long ScheduleId { get; set; }
    public IEnumerable<SamplingItemDto> Items { get; set; } = Enumerable.Empty<SamplingItemDto>();
}

public class SamplingItemDto
{
    public string SourceSystem { get; set; } = string.Empty;
    public string SourceModule { get; set; } = string.Empty;
    public string DocumentNo { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public DateTime DocumentDate { get; set; }
    public string? Department { get; set; }
    public string? BusinessOwner { get; set; }
    public string? Description { get; set; }
    public int RiskLevel { get; set; }
    public string? SamplingReason { get; set; }
    public string? BatchNo { get; set; }
    public decimal? Amount { get; set; }
    public string? Currency { get; set; }
}

public class SamplingUpdateDto : SamplingItemDto
{
    public long Id { get; set; }
    public int Status { get; set; }
}

public class SamplingQueryDto
{
    public long ScheduleId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
    public int? Status { get; set; }
    public string? DocumentType { get; set; }
    public string? Keyword { get; set; }
}

public class SamplingListDto
{
    public long Id { get; set; }
    public string SamplingNo { get; set; } = string.Empty;
    public string SourceSystem { get; set; } = string.Empty;
    public string SourceModule { get; set; } = string.Empty;
    public string DocumentNo { get; set; } = string.Empty;
    public string DocumentType { get; set; } = string.Empty;
    public DateTime DocumentDate { get; set; }
    public string? Department { get; set; }
    public string? BusinessOwner { get; set; }
    public string? Description { get; set; }
    public int RiskLevel { get; set; }
    public int Status { get; set; }
    public string? BatchNo { get; set; }
    public decimal? Amount { get; set; }
    public DateTime CreatedAt { get; set; }
    public int CheckRecordCount { get; set; }
}
#endregion

#region CheckRecord DTOs
public class CheckRecordCreateDto
{
    public long ScheduleId { get; set; }
    public long? ChecklistItemId { get; set; }
    public long? SamplingRecordId { get; set; }
    public string? Findings { get; set; }
    public string? AuditNotes { get; set; }
    public bool? IsCompliant { get; set; }
    public int RiskLevel { get; set; }
    public int EvidenceStatus { get; set; }
}

public class CheckRecordUpdateDto
{
    public long Id { get; set; }
    public string? Findings { get; set; }
    public string? AuditNotes { get; set; }
    public string? BusinessResponse { get; set; }
    public bool? IsCompliant { get; set; }
    public int RiskLevel { get; set; }
    public int EvidenceStatus { get; set; }
    public int Status { get; set; }
}

public class CheckRecordResultDto
{
    public long Id { get; set; }
    public bool IsCompliant { get; set; }
    public string Findings { get; set; } = string.Empty;
    public int RiskLevel { get; set; }
}

public class CheckRecordReviewDto
{
    public long Id { get; set; }
    public bool Approved { get; set; }
    public string ReviewComments { get; set; } = string.Empty;
}

public class CheckRecordListDto
{
    public long Id { get; set; }
    public long ScheduleId { get; set; }
    public long? ChecklistItemId { get; set; }
    public string? ChecklistItemNo { get; set; }
    public long? SamplingRecordId { get; set; }
    public string? SamplingDocNo { get; set; }
    public int Status { get; set; }
    public bool? IsCompliant { get; set; }
    public string? Findings { get; set; }
    public int RiskLevel { get; set; }
    public int EvidenceStatus { get; set; }
    public DateTime? CheckedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? SourceReference { get; set; }
    public int EvidenceCount { get; set; }
}
#endregion

#region Rectification DTOs
public class RectificationCreateDto
{
    public long ScheduleId { get; set; }
    public long? CheckRecordId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RootCause { get; set; } = string.Empty;
    public string ActionPlan { get; set; } = string.Empty;
    public long OwnerId { get; set; }
    public DateTime Deadline { get; set; }
    public int RiskLevel { get; set; }
    public string? Remarks { get; set; }
}

public class RectificationUpdateDto
{
    public long Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string RootCause { get; set; } = string.Empty;
    public string ActionPlan { get; set; } = string.Empty;
    public long OwnerId { get; set; }
    public DateTime Deadline { get; set; }
    public int RiskLevel { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? PreventiveAction { get; set; }
    public string? Remarks { get; set; }
}

public class RectificationQueryDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public long? ScheduleId { get; set; }
    public long? OwnerId { get; set; }
    public int? Status { get; set; }
    public int? RiskLevel { get; set; }
    public bool MyAssigned { get; set; } = false;
}

public class RectificationVerifyDto
{
    public long Id { get; set; }
    public string VerificationResult { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
}

public class RectificationListDto
{
    public long Id { get; set; }
    public string RectificationNo { get; set; } = string.Empty;
    public long ScheduleId { get; set; }
    public string ScheduleTitle { get; set; } = string.Empty;
    public long? CheckRecordId { get; set; }
    public string Title { get; set; } = string.Empty;
    public long OwnerId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public int Status { get; set; }
    public int RiskLevel { get; set; }
    public DateTime CreatedAt { get; set; }
}
#endregion

#region EvidenceMissing DTOs
public class EvidenceMissingCreateDto
{
    public long CheckRecordId { get; set; }
    public long? ChecklistItemId { get; set; }
    public string MissingDescription { get; set; } = string.Empty;
    public long? ResponsibleId { get; set; }
}

public class EvidenceMissingRequestDto
{
    public long Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public long ResponsibleId { get; set; }
    public DateTime Deadline { get; set; }
}

public class EvidenceMissingSupplyDto
{
    public long Id { get; set; }
    public string SupplierComments { get; set; } = string.Empty;
    public IEnumerable<EvidenceUploadDto> Evidences { get; set; } = Enumerable.Empty<EvidenceUploadDto>();
}

public class EvidenceMissingReviewDto
{
    public long Id { get; set; }
    public int NewStatus { get; set; }
    public string ReviewerComments { get; set; } = string.Empty;
}

public class EvidenceMissingWaiveDto
{
    public long Id { get; set; }
    public string WaiveReason { get; set; } = string.Empty;
}

public class EvidenceMissingQueryDto
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? Status { get; set; }
    public long? ResponsibleId { get; set; }
    public bool MyAssigned { get; set; } = false;
}

public class EvidenceMissingListDto
{
    public long Id { get; set; }
    public string MissingNo { get; set; } = string.Empty;
    public long CheckRecordId { get; set; }
    public long? ChecklistItemId { get; set; }
    public int Status { get; set; }
    public string MissingDescription { get; set; } = string.Empty;
    public long RequestedById { get; set; }
    public long? ResponsibleId { get; set; }
    public string? ResponsibleName { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? Deadline { get; set; }
    public DateTime? SuppliedAt { get; set; }
    public bool? IsWaived { get; set; }
    public int EvidenceCount { get; set; }
}
#endregion

#region Evidence DTOs
public class EvidenceUploadDto
{
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class EvidenceAttachDto
{
    public long? CheckRecordId { get; set; }
    public long? ChecklistItemId { get; set; }
    public long? SamplingRecordId { get; set; }
    public long? RectificationId { get; set; }
    public IEnumerable<EvidenceUploadDto> Evidences { get; set; } = Enumerable.Empty<EvidenceUploadDto>();
}

public class EvidenceDto
{
    public long Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsSupplement { get; set; }
    public DateTime CreatedAt { get; set; }
}
#endregion

#region ProcessingHistory DTOs
public class ProcessingHistoryQueryDto
{
    public string EntityType { get; set; } = string.Empty;
    public long EntityId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class ProcessingHistoryDto
{
    public long Id { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public long EntityId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? FromStatus { get; set; }
    public int? ToStatus { get; set; }
    public long OperatorId { get; set; }
    public string OperatorName { get; set; } = string.Empty;
    public int OperatorRole { get; set; }
    public string OperatorRoleName { get; set; } = string.Empty;
    public DateTime OperatedAt { get; set; }
    public string? BatchId { get; set; }
    public string? SourceReference { get; set; }
}
#endregion
