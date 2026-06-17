using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class AreaService : IAreaService
{
    private readonly AppDbContext _context;

    public AreaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AreaDto>> GetAllAsync()
    {
        return await _context.Areas
            .OrderBy(x => x.Name)
            .Select(x => new AreaDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                IsActive = x.IsActive
            })
            .ToListAsync();
    }

    public async Task<PagedResult<AreaDto>> GetPagedListAsync(AreaQueryDto query)
    {
        var queryable = _context.Areas.IgnoreQueryFilters().AsQueryable();

        if (!string.IsNullOrEmpty(query.Name))
            queryable = queryable.Where(x => x.Name.Contains(query.Name));

        if (query.IsActive.HasValue)
            queryable = queryable.Where(x => x.IsActive == query.IsActive.Value);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(x => x.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new AreaDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<AreaDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<AreaDto?> GetByIdAsync(int id)
    {
        var entity = await _context.Areas.IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null) return null;

        return new AreaDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public async Task<AreaDto> CreateAsync(AreaCreateDto dto)
    {
        var entity = new Area
        {
            Name = dto.Name,
            Description = dto.Description,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.Areas.Add(entity);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<AreaDto> UpdateAsync(AreaUpdateDto dto)
    {
        var entity = await _context.Areas.IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == dto.Id);

        if (entity == null)
            throw new KeyNotFoundException($"区域不存在，ID: {dto.Id}");

        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.Areas.FindAsync(id);
        if (entity == null) return false;

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();

        return true;
    }
}
