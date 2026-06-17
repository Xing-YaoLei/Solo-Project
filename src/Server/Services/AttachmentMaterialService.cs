using Microsoft.EntityFrameworkCore;
using SiteSchedule.Data;
using SiteSchedule.Dtos.AttachmentMaterial;
using SiteSchedule.Dtos.Common;
using SiteSchedule.Extensions;
using SiteSchedule.Models;

namespace SiteSchedule.Services;

public class AttachmentMaterialService : IAttachmentMaterialService
{
    private readonly AppDbContext _context;

    public AttachmentMaterialService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AttachmentMaterialDto>> GetPagedListAsync(AttachmentMaterialQueryDto query)
    {
        var queryable = _context.AttachmentMaterials.AsQueryable();

        if (!string.IsNullOrEmpty(query.Name))
            queryable = queryable.Where(x => x.Name.Contains(query.Name));

        if (query.Category.HasValue)
            queryable = queryable.Where(x => x.Category == query.Category.Value);

        if (query.IsRequired.HasValue)
            queryable = queryable.Where(x => x.IsRequired == query.IsRequired.Value);

        if (query.IsActive.HasValue)
            queryable = queryable.IgnoreQueryFilters().Where(x => x.IsActive == query.IsActive.Value);

        var totalCount = await queryable.CountAsync();

        var items = await queryable
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.CreatedAt)
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(x => new AttachmentMaterialDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                Category = x.Category,
                CategoryText = x.Category.ToString(),
                IsRequired = x.IsRequired,
                SortOrder = x.SortOrder,
                FileExtensions = x.FileExtensions,
                MaxFileSize = x.MaxFileSize,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt,
                UpdatedAt = x.UpdatedAt,
                CreatedBy = x.CreatedBy,
                UpdatedBy = x.UpdatedBy
            })
            .ToListAsync();

        return new PagedResult<AttachmentMaterialDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / query.PageSize)
        };
    }

    public async Task<AttachmentMaterialDto?> GetByIdAsync(int id)
    {
        var entity = await _context.AttachmentMaterials.IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entity == null) return null;

        return new AttachmentMaterialDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description,
            Category = entity.Category,
            CategoryText = entity.Category.ToString(),
            IsRequired = entity.IsRequired,
            SortOrder = entity.SortOrder,
            FileExtensions = entity.FileExtensions,
            MaxFileSize = entity.MaxFileSize,
            IsActive = entity.IsActive,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            CreatedBy = entity.CreatedBy,
            UpdatedBy = entity.UpdatedBy
        };
    }

    public async Task<AttachmentMaterialDto> CreateAsync(AttachmentMaterialCreateDto dto)
    {
        var entity = new AttachmentMaterial
        {
            Name = dto.Name,
            Description = dto.Description,
            Category = dto.Category,
            IsRequired = dto.IsRequired,
            SortOrder = dto.SortOrder,
            FileExtensions = dto.FileExtensions,
            MaxFileSize = dto.MaxFileSize,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.AttachmentMaterials.Add(entity);
        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<AttachmentMaterialDto> UpdateAsync(AttachmentMaterialUpdateDto dto)
    {
        var entity = await _context.AttachmentMaterials.IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.Id == dto.Id);

        if (entity == null)
            throw new KeyNotFoundException($"附件材料不存在，ID: {dto.Id}");

        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Category = dto.Category;
        entity.IsRequired = dto.IsRequired;
        entity.SortOrder = dto.SortOrder;
        entity.FileExtensions = dto.FileExtensions;
        entity.MaxFileSize = dto.MaxFileSize;
        entity.IsActive = dto.IsActive;
        entity.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return (await GetByIdAsync(entity.Id))!;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.AttachmentMaterials.FindAsync(id);
        if (entity == null) return false;

        entity.IsActive = false;
        entity.UpdatedAt = DateTime.Now;
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<List<AttachmentMaterialDto>> GetAllAsync()
    {
        return await _context.AttachmentMaterials
            .OrderBy(x => x.SortOrder)
            .Select(x => new AttachmentMaterialDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                Category = x.Category,
                CategoryText = x.Category.ToString(),
                IsRequired = x.IsRequired,
                SortOrder = x.SortOrder,
                FileExtensions = x.FileExtensions,
                MaxFileSize = x.MaxFileSize,
                IsActive = x.IsActive
            })
            .ToListAsync();
    }

    public async Task<List<AttachmentMaterialDto>> GetByCategoryAsync(MaterialCategory category)
    {
        return await _context.AttachmentMaterials
            .Where(x => x.Category == category)
            .OrderBy(x => x.SortOrder)
            .Select(x => new AttachmentMaterialDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                Category = x.Category,
                CategoryText = x.Category.ToString(),
                IsRequired = x.IsRequired,
                SortOrder = x.SortOrder
            })
            .ToListAsync();
    }
}
