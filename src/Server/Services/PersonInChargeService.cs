using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class PersonInChargeService : IPersonInChargeService
{
    private readonly AppDbContext _context;

    public PersonInChargeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<PersonInChargeDto>> GetAllAsync()
    {
        return await _context.PersonInCharges
            .Include(p => p.Area)
            .OrderBy(x => x.Name)
            .Select(x => new PersonInChargeDto
            {
                Id = x.Id,
                Name = x.Name,
                Phone = x.Phone,
                Email = x.Email,
                Position = x.Position,
                AreaId = x.AreaId,
                AreaName = x.Area != null ? x.Area.Name : null,
                IsActive = x.IsActive
            })
            .ToListAsync();
    }

    public async Task<PagedResult<PersonInChargeDto>> GetPagedListAsync(PersonInChargeQueryDto query)
    {
        var queryable = _context.PersonInCharges
            .IgnoreQueryFilters()
            .Include(p => p.Area)
            .AsQueryable();

        if (!string.IsNullOrEmpty(query.Name))
            queryable = queryable.Where(x => x.Name.Contains(query.Name));

        if (!string.IsNullOrEmpty(query.Phone))
            queryable = queryable.Where(x => x.Phone.Contains(query.Phone));

        if (query.AreaId.HasValue)
            queryable = queryable.Where(x => x.AreaId == query.AreaId.Value);

        if (query.IsActive.HasValue)
            queryable = queryable.Where(x => x.IsActive == query.IsActive.Value);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(x => x.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new PersonInChargeDto
            {
                Id = x.Id,
                Name = x.Name,
                Phone = x.Phone,
                Email = x.Email,
                Position = x.Position,
                AreaId = x.AreaId,
                AreaName = x.Area != null ? x.Area.Name : null,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt
            })
            .ToListAsync();

        return new PagedResult<PersonInChargeDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<PersonInChargeDto?> GetByIdAsync(int id)
    {
        var entity = await _context.PersonInCharges
            .IgnoreQueryFilters()
            .Include(p => p.Area)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null) return null;

        return new PersonInChargeDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Phone = entity.Phone,
            Email = entity.Email,
            Position = entity.Position,
            AreaId = entity.AreaId,
            AreaName = entity.Area != null ? entity.Area.Name : null,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }

    public async Task<PersonInChargeDto> CreateAsync(PersonInChargeCreateDto dto)
    {
        var entity = new PersonInCharge
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Email = dto.Email,
            Position = dto.Position,
            AreaId = dto.AreaId,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.PersonInCharges.Add(entity);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<PersonInChargeDto> UpdateAsync(PersonInChargeUpdateDto dto)
    {
        var entity = await _context.PersonInCharges
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == dto.Id);

        if (entity == null)
            throw new KeyNotFoundException($"负责人不存在，ID: {dto.Id}");

        entity.Name = dto.Name;
        entity.Phone = dto.Phone;
        entity.Email = dto.Email;
        entity.Position = dto.Position;
        entity.AreaId = dto.AreaId;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.PersonInCharges.FindAsync(id);
        if (entity == null) return false;

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<PersonInChargeDto>> GetByAreaIdAsync(int areaId)
    {
        return await _context.PersonInCharges
            .Where(x => x.AreaId == areaId)
            .OrderBy(x => x.Name)
            .Select(x => new PersonInChargeDto
            {
                Id = x.Id,
                Name = x.Name,
                Phone = x.Phone,
                IsActive = x.IsActive
            })
            .ToListAsync();
    }
}
