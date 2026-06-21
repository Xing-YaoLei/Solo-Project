using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Application.Dtos;

public record AddParticipantRequest(
    Guid HearingId,
    Guid UserId,
    string Role);

public record UpdateAttendanceRequest(
    AttendanceStatus AttendanceStatus,
    DateTime? CheckInTime,
    string? Notes);

public record AttendanceUpdateItem(
    Guid ParticipantId,
    AttendanceStatus AttendanceStatus,
    DateTime? CheckInTime,
    string? Notes);

public record BatchAttendanceRequest(
    List<AttendanceUpdateItem> Updates);

public record ParticipantResponse(
    Guid Id,
    Guid HearingId,
    Guid UserId,
    string FullName,
    string Role,
    AttendanceStatus AttendanceStatus,
    DateTime? CheckInTime,
    string? Notes);
