using FitnessDietTracker.API.Data;
using FitnessDietTracker.API.Dtos;
using FitnessDietTracker.API.Enums;
using FitnessDietTracker.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace FitnessDietTracker.API.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Coach)
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);

        if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("邮箱或密码错误");

        var token = GenerateJwtToken(user);
        return new AuthResponseDto
        {
            Token = token,
            Expiration = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpireInMinutes"]!)),
            User = MapToDto(user)
        };
    }

    public async Task<UserDto> RegisterAsync(RegisterDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email || u.UserName == dto.UserName))
            throw new InvalidOperationException("邮箱或用户名已存在");

        var user = new User
        {
            UserName = dto.UserName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            PasswordHash = HashPassword(dto.Password),
            Role = dto.Role,
            CoachId = dto.CoachId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        await _context.Entry(user).Reference(u => u.Coach).LoadAsync();
        return MapToDto(user);
    }

    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = await _context.Users
            .Include(u => u.Coach)
            .FirstOrDefaultAsync(u => u.Id == id);
        return user != null ? MapToDto(user) : null;
    }

    public async Task<List<UserDto>> GetCoachesAsync()
    {
        return await _context.Users
            .Where(u => u.Role == UserRole.Coach && u.IsActive)
            .Select(u => MapToDto(u))
            .ToListAsync();
    }

    public async Task<List<UserDto>> GetClientsByCoachAsync(int coachId)
    {
        return await _context.Users
            .Where(u => u.CoachId == coachId && u.IsActive)
            .Include(u => u.Coach)
            .Select(u => MapToDto(u))
            .ToListAsync();
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpireInMinutes"]!));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(bytes);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return HashPassword(password) == hash;
    }

    private static UserDto MapToDto(User user) => new()
    {
        Id = user.Id,
        UserName = user.UserName,
        Email = user.Email,
        PhoneNumber = user.PhoneNumber,
        Role = user.Role,
        CoachId = user.CoachId,
        CoachName = user.Coach?.UserName,
        AvatarUrl = user.AvatarUrl,
        IsActive = user.IsActive
    };
}
