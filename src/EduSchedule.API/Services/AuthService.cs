using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using EduSchedule.API.Data;
using EduSchedule.API.Models;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtSettings _jwtSettings;

    public AuthService(AppDbContext context, IOptions<JwtSettings> jwtSettings)
    {
        _context = context;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<LoginResultDto> LoginAsync(string username, string password, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.UserName == username || u.Email == username, cancellationToken);

        if (user == null || !VerifyPassword(password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("用户名或密码错误");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("账户已被禁用");
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        var token = GenerateJwtToken(user.Id, user.UserName, user.Role);

        return new LoginResultDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                RealName = user.RealName,
                Email = user.Email,
                Phone = user.Phone,
                Role = user.Role,
                RoleName = GetRoleName(user.Role),
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department?.Name,
                Title = user.Title,
                AvatarUrl = user.AvatarUrl
            }
        };
    }

    public async Task<UserDto> RegisterAsync(RegisterDto registerDto, CancellationToken cancellationToken = default)
    {
        var existingUser = await _context.Users
            .AnyAsync(u => u.UserName == registerDto.UserName || u.Email == registerDto.Email, cancellationToken);

        if (existingUser)
        {
            throw new InvalidOperationException("用户名或邮箱已存在");
        }

        var user = new User
        {
            UserName = registerDto.UserName,
            RealName = registerDto.RealName,
            Email = registerDto.Email,
            Phone = registerDto.Phone,
            PasswordHash = HashPassword(registerDto.Password),
            Role = registerDto.Role,
            DepartmentId = registerDto.DepartmentId,
            Title = registerDto.Title,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            RealName = user.RealName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            RoleName = GetRoleName(user.Role),
            DepartmentId = user.DepartmentId,
            Title = user.Title
        };
    }

    public async Task<UserDto?> GetCurrentUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users
            .Include(u => u.Department)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null) return null;

        return new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            RealName = user.RealName,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            RoleName = GetRoleName(user.Role),
            DepartmentId = user.DepartmentId,
            DepartmentName = user.Department?.Name,
            Title = user.Title,
            AvatarUrl = user.AvatarUrl
        };
    }

    public async Task<bool> ChangePasswordAsync(int userId, string oldPassword, string newPassword, CancellationToken cancellationToken = default)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
        if (user == null) return false;

        if (!VerifyPassword(oldPassword, user.PasswordHash))
            return false;

        user.PasswordHash = HashPassword(newPassword);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }

    public string GenerateJwtToken(int userId, string username, RoleType role)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role.ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    private static string GetRoleName(RoleType role)
    {
        return role switch
        {
            RoleType.Administrator => "系统管理员",
            RoleType.Teacher => "教师",
            RoleType.Student => "学生",
            RoleType.DepartmentHead => "系主任",
            RoleType.AcademicAffairs => "教务处",
            RoleType.Dean => "院长",
            _ => "未知"
        };
    }
}

public class JwtSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int ExpirationInMinutes { get; set; }
}

public class LoginResultDto
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
}

public class UserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string RealName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public RoleType Role { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public int? DepartmentId { get; set; }
    public string? DepartmentName { get; set; }
    public string? Title { get; set; }
    public string? AvatarUrl { get; set; }
}

public class RegisterDto
{
    public string UserName { get; set; } = string.Empty;
    public string RealName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Password { get; set; } = string.Empty;
    public RoleType Role { get; set; }
    public int? DepartmentId { get; set; }
    public string? Title { get; set; }
}
