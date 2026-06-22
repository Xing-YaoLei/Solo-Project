using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using ComplianceAudit.API.DTOs;
using ComplianceAudit.API.DTOs.Auth;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Infrastructure.Data;

namespace ComplianceAudit.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto)
    {
        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user == null)
            return Ok(ApiResponse<AuthResponseDto>.Fail("用户不存在或密码错误", "INVALID_CREDENTIALS"));

        if (!user.IsActive)
            return Ok(ApiResponse<AuthResponseDto>.Fail("账户已被禁用", "ACCOUNT_DISABLED"));

        var result = await _signInManager.PasswordSignInAsync(user, dto.Password, false, false);
        if (!result.Succeeded)
            return Ok(ApiResponse<AuthResponseDto>.Fail("用户不存在或密码错误", "INVALID_CREDENTIALS"));

        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["JwtSettings:ExpirationInMinutes"] ?? "1440"));

        return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserInfoDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                EmployeeId = user.EmployeeId,
                Department = user.Department,
                Role = (int)user.Role,
                RoleName = GetRoleName(user.Role)
            }
        }));
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
    {
        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
            return Ok(ApiResponse<AuthResponseDto>.Fail("邮箱已被注册", "EMAIL_EXISTS"));

        var user = new ApplicationUser
        {
            UserName = dto.Email,
            Email = dto.Email,
            FullName = dto.FullName,
            EmployeeId = dto.EmployeeId,
            Department = dto.Department,
            Role = (AuditRole)dto.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return Ok(ApiResponse<AuthResponseDto>.Fail(string.Join("; ", result.Errors.Select(e => e.Description)), "REGISTRATION_FAILED"));

        var token = GenerateJwtToken(user);
        var expiresAt = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["JwtSettings:ExpirationInMinutes"] ?? "1440"));

        return Ok(ApiResponse<AuthResponseDto>.Ok(new AuthResponseDto
        {
            Token = token,
            ExpiresAt = expiresAt,
            User = new UserInfoDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                EmployeeId = user.EmployeeId,
                Department = user.Department,
                Role = (int)user.Role,
                RoleName = GetRoleName(user.Role)
            }
        }, "注册成功"));
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<ApiResponse<UserInfoDto>>> GetCurrentUser()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
            return Ok(ApiResponse<UserInfoDto>.Fail("未登录", "NOT_AUTHENTICATED"));

        var user = await _userManager.FindByIdAsync(userId.Value.ToString());
        if (user == null)
            return Ok(ApiResponse<UserInfoDto>.Fail("用户不存在", "USER_NOT_FOUND"));

        return Ok(ApiResponse<UserInfoDto>.Ok(new UserInfoDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            EmployeeId = user.EmployeeId,
            Department = user.Department,
            Role = (int)user.Role,
            RoleName = GetRoleName(user.Role)
        }));
    }

    [HttpPost("logout")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<ApiResponse<bool>>> Logout()
    {
        await _signInManager.SignOutAsync();
        return Ok(ApiResponse<bool>.Ok(true, "登出成功"));
    }

    [HttpGet("users")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserInfoDto>>>> GetUsers()
    {
        var users = _userManager.Users.Where(u => u.IsActive).ToList();
        var dtos = users.Select(u => new UserInfoDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email ?? string.Empty,
            EmployeeId = u.EmployeeId,
            Department = u.Department,
            Role = (int)u.Role,
            RoleName = GetRoleName(u.Role)
        });
        return Ok(ApiResponse<IEnumerable<UserInfoDto>>.Ok(dtos));
    }

    [HttpGet("users/role/{role}")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<ApiResponse<IEnumerable<UserInfoDto>>>> GetUsersByRole(int role)
    {
        var users = _userManager.Users.Where(u => u.IsActive && u.Role == (AuditRole)role).ToList();
        var dtos = users.Select(u => new UserInfoDto
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email ?? string.Empty,
            EmployeeId = u.EmployeeId,
            Department = u.Department,
            Role = (int)u.Role,
            RoleName = GetRoleName(u.Role)
        });
        return Ok(ApiResponse<IEnumerable<UserInfoDto>>.Ok(dtos));
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = Encoding.UTF8.GetBytes(jwtSettings["Secret"]
            ?? throw new InvalidOperationException("JWT Secret not configured"));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim("Role", ((int)user.Role).ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(jwtSettings["ExpirationInMinutes"] ?? "1440")),
            signingCredentials: new SigningCredentials(
                new SymmetricSecurityKey(secretKey),
                SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    protected long? GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(claim, out var id) ? id : null;
    }

    protected AuditRole? GetCurrentUserRole()
    {
        var claim = User.FindFirstValue("Role");
        return int.TryParse(claim, out var role) ? (AuditRole)role : null;
    }

    private static string GetRoleName(AuditRole role) => role switch
    {
        AuditRole.Auditor => "审计员",
        AuditRole.BusinessOwner => "业务负责人",
        AuditRole.ComplianceOfficer => "合规官",
        AuditRole.Management => "管理层",
        _ => "未知角色"
    };
}
