using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public interface IAuthService
{
    Task<LoginResultDto> LoginAsync(string username, string password, CancellationToken cancellationToken = default);
    Task<UserDto> RegisterAsync(RegisterDto registerDto, CancellationToken cancellationToken = default);
    Task<UserDto?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default);
    Task<bool> ChangePasswordAsync(int userId, string oldPassword, string newPassword, CancellationToken cancellationToken = default);
    string GenerateJwtToken(int userId, string username, RoleType role);
}
