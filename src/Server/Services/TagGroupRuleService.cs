using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.TagGroupRule;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class TagGroupRuleService : ITagGroupRuleService
{
    private readonly AppDbContext _context;

    public TagGroupRuleService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<TagGroupRuleDto>> GetPagedListAsync(TagGroupRuleQueryDto query)
    {
        var queryable = _context.TagGroupRules
            .Include(t => t.Area)
            .Include(t => t.PersonInCharge)
            .AsQueryable();

        if (!string.IsNullOrEmpty(query.TagName))
            queryable = queryable.Where(x => x.TagName.Contains(query.TagName));

        if (query.AreaId.HasValue)
            queryable = queryable.Where(x => x.AreaId == query.AreaId.Value);

        if (query.PersonInChargeId.HasValue)
            queryable = queryable.Where(x => x.PersonInChargeId == query.PersonInChargeId.Value);

        if (query.IsActive.HasValue)
            queryable = queryable.IgnoreQueryFilters().Where(x => x.IsActive == query.IsActive.Value);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new TagGroupRuleDto
            {
                Id = x.Id,
                TagName = x.TagName,
                Description = x.Description,
                Color = x.Color,
                AreaId = x.AreaId,
                AreaName = x.Area != null ? x.Area.Name : null,
                PersonInChargeId = x.PersonInChargeId,
                PersonInChargeName = x.PersonInCharge != null ? x.PersonInCharge.Name : null,
                SortOrder = x.SortOrder,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<TagGroupRuleDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<TagGroupRuleDto?> GetByIdAsync(int id)
    {
        var entity = await _context.TagGroupRules.IgnoreQueryFilters()
            .Include(t => t.Area)
            .Include(t => t.PersonInCharge)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null) return null;

        return new TagGroupRuleDto
        {
            Id = entity.Id,
            TagName = entity.TagName,
            Description = entity.Description,
            Color = entity.Color,
            AreaId = entity.AreaId,
            AreaName = entity.Area != null ? entity.Area.Name : null,
            PersonInChargeId = entity.PersonInChargeId,
            PersonInChargeName = entity.PersonInCharge != null ? entity.PersonInCharge.Name : null,
            SortOrder = entity.SortOrder,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public async Task<TagGroupRuleDto> CreateAsync(TagGroupRuleCreateDto dto)
    {
        var entity = new TagGroupRule
        {
            TagName = dto.TagName,
            Description = dto.Description,
            Color = dto.Color,
            AreaId = dto.AreaId,
            PersonInChargeId = dto.PersonInChargeId,
            SortOrder = dto.SortOrder,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.TagGroupRules.Add(entity);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<TagGroupRuleDto> UpdateAsync(TagGroupRuleUpdateDto dto)
    {
        var entity = await _context.TagGroupRules.IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == dto.Id);

        if (entity == null)
            throw new KeyNotFoundException($"标签分组不存在，ID: {dto.Id}");

        entity.TagName = dto.TagName;
        entity.Description = dto.Description;
        entity.Color = dto.Color;
        entity.AreaId = dto.AreaId;
        entity.PersonInChargeId = dto.PersonInChargeId;
        entity.SortOrder = dto.SortOrder;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.TagGroupRules.FindAsync(id);
        if (entity == null) return false;

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<TagGroupRuleDto>> GetAllAsync()
    {
        return await _context.TagGroupRules
            .OrderBy(x => x.SortOrder)
            .Select(x => new TagGroupRuleDto
            {
                Id = x.Id,
                TagName = x.TagName,
                Description = x.Description,
                Color = x.Color,
                AreaId = x.AreaId,
                PersonInChargeId = x.PersonInChargeId,
                SortOrder = x.SortOrder,
                IsActive = x.IsActive
            })
            .ToListAsync();
    }
}
