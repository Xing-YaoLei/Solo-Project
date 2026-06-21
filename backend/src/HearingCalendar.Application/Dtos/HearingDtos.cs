using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Application.Dtos;

public record CreateHearingRequest(
    string CaseNumber,
    string CaseName,
    string CourtName,
    string CourtRoom,
    DateOnly HearingDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    Guid? AssignedLawyerId,
    string? Notes);

public record UpdateHearingRequest(
    string? CaseNumber,
    string? CaseName,
    string? CourtName,
    string? CourtRoom,
    DateOnly? HearingDate,
    TimeOnly? StartTime,
    TimeOnly? EndTime,
    Guid? AssignedLawyerId,
    string? Notes);

public record HearingDetailResponse(
    Guid Id,
    string CaseNumber,
    string CaseName,
    string CourtName,
    string CourtRoom,
    DateOnly HearingDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    HearingStatus Status,
    bool IsConflictFlagged,
    Guid? ConflictId,
    Guid CreatedBy,
    Guid? AssignedLawyerId,
    string? Notes,
    List<ParticipantResponse> Participants,
    List<AttachmentResponse> Attachments,
    List<StatusLogEntry> StatusLogs,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record HearingListResponse(
    Guid Id,
    string CaseNumber,
    string CaseName,
    string CourtName,
    string CourtRoom,
    DateOnly HearingDate,
    TimeOnly StartTime,
    TimeOnly EndTime,
    HearingStatus Status,
    bool IsConflictFlagged,
    Guid? AssignedLawyerId);

public record BatchStatusUpdateRequest(
    List<Guid> HearingIds,
    HearingStatus Status,
    string? Reason);

public record StatusLogEntry(
    Guid Id,
    HearingStatus FromStatus,
    HearingStatus ToStatus,
    Guid ChangedBy,
    string? Reason,
    DateTime CreatedAt,
    Guid? RelatedAttachmentId);
