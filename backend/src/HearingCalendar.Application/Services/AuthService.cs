using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HearingCalendar.Application.Dtos;
using HearingCalendar.Application.Interfaces;
using HearingCalendar.Domain.Entities;
using HearingCalendar.Infrastructure.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace HearingCalendar.Application.Services;

public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepo;
    private readonly IConfiguration _configuration;

    public AuthService(IRepository<User> userRepo, IConfiguration configuration)
    {
        _userRepo = userRepo;
        _configuration = configuration;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request)
    {
        var users = await _userRepo.FindAsync(u => u.Username == request.Username);
        var user = users.FirstOrDefault();

        if (user is null || !BCryptVerify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid username or password");

        if (!user.IsActive)
            throw new UnauthorizedAccessException("User account is deactivated");

        var expiresAt = DateTime.UtcNow.AddHours(24);
        var token = GenerateJwtToken(user, expiresAt);

        return new LoginResponse(token, expiresAt, user.Role, user.Id, user.FullName);
    }

    public async Task<UserResponse> GetUserAsync(Guid userId)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user is null)
            throw new KeyNotFoundException($"User {userId} not found");

        return new UserResponse(user.Id, user.Username, user.Email, user.FullName, user.Role, user.Department, user.IsActive);
    }

    private string GenerateJwtToken(User user, DateTime expiresAt)
    {
        var secretKey = _configuration["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var issuer = _configuration["Jwt:Issuer"] ?? "HearingCalendar";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("UserId", user.Id.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: issuer,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static bool BCryptVerify(string password, string passwordHash)
    {
        return BCrypt.Net.BCrypt.Verify(password, passwordHash);
    }
}
