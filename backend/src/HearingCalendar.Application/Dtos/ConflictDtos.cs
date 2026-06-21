using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Application.Dtos;

public record CreateConflictRequest(
    Guid HearingId,
    ConflictType ConflictType,
    string Description);

public record ResolveConflictRequest(
    string Resolution,
    ConflictResolutionStatus ResolutionStatus,
    Guid? RelatedAttachmentId);

public record ConflictResponse(
    Guid Id,
    Guid HearingId,
    ConflictType ConflictType,
    string Description,
    Guid DetectedBy,
    DateTime DetectedAt,
    ConflictResolutionStatus ResolutionStatus,
    string? Resolution,
    Guid? ResolvedBy,
    DateTime? ResolvedAt,
    Guid? RelatedAttachmentId);
