using HearingCalendar.Application.Dtos;

namespace HearingCalendar.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request);
    Task<UserResponse> GetUserAsync(Guid userId);
}
