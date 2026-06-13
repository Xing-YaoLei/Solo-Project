using FitnessDietTracker.API.Dtos;

namespace FitnessDietTracker.API.Services;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<UserDto> RegisterAsync(RegisterDto dto);
    Task<UserDto?> GetUserByIdAsync(int id);
    Task<List<UserDto>> GetCoachesAsync();
    Task<List<UserDto>> GetClientsByCoachAsync(int coachId);
}
