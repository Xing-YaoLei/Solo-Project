using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Dtos.CustomerProfile;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class CustomerProfileService : ICustomerProfileService
{
    private readonly AppDbContext _context;

    public CustomerProfileService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<CustomerProfileDto>> GetPagedListAsync(CustomerProfileQueryDto query)
    {
        var queryable = _context.CustomerProfiles.AsQueryable();

        if (!string.IsNullOrEmpty(query.CustomerName))
            queryable = queryable.Where(x => x.CustomerName.Contains(query.CustomerName));

        if (!string.IsNullOrEmpty(query.Phone))
            queryable = queryable.Where(x => x.Phone.Contains(query.Phone));

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderByDescending(x => x.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new CustomerProfileDto
            {
                Id = x.Id,
                CustomerName = x.CustomerName,
                Phone = x.Phone,
                Email = x.Email,
                Address = x.Address,
                IdCard = x.IdCard,
                Remark = x.Remark,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
                SiteCount = x.ConstructionSites.Count
            })
            .ToListAsync();

        return new PagedResult<CustomerProfileDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<CustomerProfileDto?> GetByIdAsync(int id)
    {
        var entity = await _context.CustomerProfiles
            .Include(c => c.ConstructionSites)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null) return null;

        return new CustomerProfileDto
        {
            Id = entity.Id,
            CustomerName = entity.CustomerName,
            Phone = entity.Phone,
            Email = entity.Email,
            Address = entity.Address,
            IdCard = entity.IdCard,
            Remark = entity.Remark,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            SiteCount = entity.ConstructionSites.Count
        };
    }

    public async Task<CustomerProfileDto> CreateAsync(CustomerProfileCreateDto dto)
    {
        var entity = new CustomerProfile
        {
            CustomerName = dto.CustomerName,
            Phone = dto.Phone,
            Email = dto.Email,
            Address = dto.Address,
            IdCard = dto.IdCard,
            Remark = dto.Remark,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.CustomerProfiles.Add(entity);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<CustomerProfileDto> UpdateAsync(CustomerProfileUpdateDto dto)
    {
        var entity = await _context.CustomerProfiles.FindAsync(dto.Id);
        if (entity == null)
            throw new KeyNotFoundException($"客户不存在，ID: {dto.Id}");

        entity.CustomerName = dto.CustomerName;
        entity.Phone = dto.Phone;
        entity.Email = dto.Email;
        entity.Address = dto.Address;
        entity.IdCard = dto.IdCard;
        entity.Remark = dto.Remark;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.CustomerProfiles.FindAsync(id);
        if (entity == null) return false;

        _context.CustomerProfiles.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<CustomerProfileDto>> GetAllAsync()
    {
        return await _context.CustomerProfiles
            .OrderBy(x => x.CustomerName)
            .Select(x => new CustomerProfileDto
            {
                Id = x.Id,
                CustomerName = x.CustomerName,
                Phone = x.Phone,
                Email = x.Email
            })
            .ToListAsync();
    }
}
