using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using PrescriptionReview.Core.Common;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Domain.Entities;
using PrescriptionReview.Domain.Enums;
using PrescriptionReview.Infrastructure.Data;

namespace PrescriptionReview.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<ApiResult<LoginResponse>> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .Include(u => u.Store)
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !user.IsActive)
        {
            return ApiResult<LoginResponse>.Fail("用户名或密码错误");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return ApiResult<LoginResponse>.Fail("用户名或密码错误");
        }

        user.LastLoginAt = DateTime.Now;
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);
        var userDto = MapToUserDto(user);

        return ApiResult<LoginResponse>.Ok(new LoginResponse
        {
            Token = token,
            ExpireAt = DateTime.Now.AddHours(8),
            User = userDto
        });
    }

    private string GenerateJwtToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"] ?? "PrescriptionReviewSecretKeyForJwtToken123456"));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("RealName", user.RealName),
            new Claim("StoreId", user.StoreId?.ToString() ?? "")
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "PrescriptionReview",
            audience: _configuration["Jwt:Audience"] ?? "PrescriptionReview",
            claims: claims,
            expires: DateTime.Now.AddHours(8),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private UserDto MapToUserDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            RealName = user.RealName,
            Role = user.Role,
            RoleName = GetRoleName(user.Role),
            StoreId = user.StoreId,
            StoreName = user.Store?.Name,
            Phone = user.Phone,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    private string GetRoleName(UserRole role)
    {
        return role switch
        {
            UserRole.Cashier => "收银员",
            UserRole.Pharmacist => "药师",
            UserRole.StoreManager => "店长",
            UserRole.Headquarters => "总部运营",
            _ => "未知"
        };
    }
}
