using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using PrescriptionReview.Core.Common;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Domain.Entities;
using PrescriptionReview.Domain.Enums;
using PrescriptionReview.Infrastructure.Data;

namespace PrescriptionReview.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResult<PagedResult<UserDto>>> GetPagedListAsync(UserQueryDto query)
    {
        var queryable = _context.Users
            .Include(u => u.Store)
            .AsQueryable();

        if (query.Role.HasValue)
        {
            queryable = queryable.Where(u => u.Role == query.Role.Value);
        }

        if (query.StoreId.HasValue)
        {
            queryable = queryable.Where(u => u.StoreId == query.StoreId.Value);
        }

        if (!string.IsNullOrEmpty(query.Keyword))
        {
            queryable = queryable.Where(u => u.Username.Contains(query.Keyword) || u.RealName.Contains(query.Keyword));
        }

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(u => u.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                RealName = u.RealName,
                Role = u.Role,
                RoleName = GetRoleName(u.Role),
                StoreId = u.StoreId,
                StoreName = u.Store != null ? u.Store.Name : null,
                Phone = u.Phone,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return ApiResult<PagedResult<UserDto>>.Ok(new PagedResult<UserDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        });
    }

    public async Task<ApiResult<UserDto>> GetByIdAsync(int id)
    {
        var user = await _context.Users
            .Include(u => u.Store)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return ApiResult<UserDto>.Fail("用户不存在");
        }

        return ApiResult<UserDto>.Ok(MapToDto(user));
    }

    public async Task<ApiResult<UserDto>> CreateAsync(UserCreateDto dto)
    {
        var existing = await _context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
        if (existing != null)
        {
            return ApiResult<UserDto>.Fail("用户名已存在");
        }

        var user = new User
        {
            Username = dto.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            RealName = dto.RealName,
            Role = dto.Role,
            StoreId = dto.StoreId,
            Phone = dto.Phone,
            IsActive = true,
            CreatedAt = DateTime.Now
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(user.Id);
    }

    public async Task<ApiResult> UpdateAsync(int id, UserUpdateDto dto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return ApiResult.Fail("用户不存在");
        }

        user.RealName = dto.RealName;
        user.Role = dto.Role;
        user.StoreId = dto.StoreId;
        user.Phone = dto.Phone;
        user.IsActive = dto.IsActive;
        user.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return ApiResult.Ok();
    }

    public async Task<ApiResult> DeleteAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
        {
            return ApiResult.Fail("用户不存在");
        }

        user.IsActive = false;
        user.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return ApiResult.Ok();
    }

    private UserDto MapToDto(User u)
    {
        return new UserDto
        {
            Id = u.Id,
            Username = u.Username,
            RealName = u.RealName,
            Role = u.Role,
            RoleName = GetRoleName(u.Role),
            StoreId = u.StoreId,
            StoreName = u.Store?.Name,
            Phone = u.Phone,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt
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
