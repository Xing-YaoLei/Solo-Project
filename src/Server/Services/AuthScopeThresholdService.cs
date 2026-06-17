using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.AuthScopeThreshold;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class AuthScopeThresholdService : IAuthScopeThresholdService
{
    private readonly AppDbContext _context;

    public AuthScopeThresholdService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AuthScopeThresholdDto>> GetPagedListAsync(AuthScopeThresholdQueryDto query)
    {
        var queryable = _context.AuthScopeThresholds.AsQueryable();

        if (!string.IsNullOrEmpty(query.RoleName))
            queryable = queryable.Where(x => x.RoleName.Contains(query.RoleName));

        if (query.ScopeType.HasValue)
            queryable = queryable.Where(x => x.ScopeType == query.ScopeType.Value);

        if (query.IsActive.HasValue)
            queryable = queryable.IgnoreQueryFilters().Where(x => x.IsActive == query.IsActive.Value);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new AuthScopeThresholdDto
            {
                Id = x.Id,
                RoleName = x.RoleName,
                ScopeType = x.ScopeType,
                ScopeTypeText = x.ScopeType.ToString(),
                ScopeValue = x.ScopeValue,
                MinValue = x.MinValue,
                MaxValue = x.MaxValue,
                CanApprove = x.CanApprove,
                CanEdit = x.CanEdit,
                CanView = x.CanView,
                SortOrder = x.SortOrder,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<AuthScopeThresholdDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<AuthScopeThresholdDto?> GetByIdAsync(int id)
    {
        var entity = await _context.AuthScopeThresholds.IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null) return null;

        return new AuthScopeThresholdDto
        {
            Id = entity.Id,
            RoleName = entity.RoleName,
            ScopeType = entity.ScopeType,
            ScopeTypeText = entity.ScopeType.ToString(),
            ScopeValue = entity.ScopeValue,
            MinValue = entity.MinValue,
            MaxValue = entity.MaxValue,
            CanApprove = entity.CanApprove,
            CanEdit = entity.CanEdit,
            CanView = entity.CanView,
            SortOrder = entity.SortOrder,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public async Task<AuthScopeThresholdDto> CreateAsync(AuthScopeThresholdCreateDto dto)
    {
        var entity = new AuthScopeThreshold
        {
            RoleName = dto.RoleName,
            ScopeType = dto.ScopeType,
            ScopeValue = dto.ScopeValue,
            MinValue = dto.MinValue,
            MaxValue = dto.MaxValue,
            CanApprove = dto.CanApprove,
            CanEdit = dto.CanEdit,
            CanView = dto.CanView,
            SortOrder = dto.SortOrder,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.AuthScopeThresholds.Add(entity);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<AuthScopeThresholdDto> UpdateAsync(AuthScopeThresholdUpdateDto dto)
    {
        var entity = await _context.AuthScopeThresholds.IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == dto.Id);

        if (entity == null)
            throw new KeyNotFoundException($"授权阈值不存在，ID: {dto.Id}");

        entity.RoleName = dto.RoleName;
        entity.ScopeType = dto.ScopeType;
        entity.ScopeValue = dto.ScopeValue;
        entity.MinValue = dto.MinValue;
        entity.MaxValue = dto.MaxValue;
        entity.CanApprove = dto.CanApprove;
        entity.CanEdit = dto.CanEdit;
        entity.CanView = dto.CanView;
        entity.SortOrder = dto.SortOrder;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.AuthScopeThresholds.FindAsync(id);
        if (entity == null) return false;

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<AuthScopeThresholdDto>> GetAllAsync()
    {
        return await _context.AuthScopeThresholds
            .OrderBy(x => x.SortOrder)
            .Select(x => new AuthScopeThresholdDto
            {
                Id = x.Id,
                RoleName = x.RoleName,
                ScopeType = x.ScopeType,
                ScopeTypeText = x.ScopeType.ToString(),
                ScopeValue = x.ScopeValue,
                MinValue = x.MinValue,
                MaxValue = x.MaxValue,
                CanApprove = x.CanApprove,
                CanEdit = x.CanEdit,
                CanView = x.CanView,
                SortOrder = x.SortOrder,
                IsActive = x.IsActive
            })
            .ToListAsync();
    }
}
