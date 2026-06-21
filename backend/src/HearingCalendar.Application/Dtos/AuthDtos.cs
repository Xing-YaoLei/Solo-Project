using HearingCalendar.Domain.Enums;

namespace HearingCalendar.Application.Dtos;

public record LoginRequest(
    string Username,
    string Password);

public record LoginResponse(
    string Token,
    DateTime ExpiresAt,
    UserRole UserRole,
    Guid UserId,
    string FullName);

public record UserResponse(
    Guid Id,
    string Username,
    string Email,
    string FullName,
    UserRole Role,
    string? Department,
    bool IsActive);
