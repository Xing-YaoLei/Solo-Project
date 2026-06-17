using AutoMapper;
using HomeImprovementPlatform.API.DTOs.Material;
using HomeImprovementPlatform.API.Models;
using Microsoft.EntityFrameworkCore;
using HomeImprovementPlatform.API.Data;

namespace HomeImprovementPlatform.API.Services;

public interface IMaterialService
{
    Task<IEnumerable<MaterialDto>> GetAllAsync(bool? isActive, string? category);
    Task<MaterialDto> GetByIdAsync(Guid id);
    Task<MaterialDto> CreateAsync(CreateMaterialDto dto);
    Task<MaterialDto> UpdateAsync(Guid id, UpdateMaterialDto dto);
    Task DeleteAsync(Guid id);
}

public class MaterialService : IMaterialService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public MaterialService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<IEnumerable<MaterialDto>> GetAllAsync(bool? isActive, string? category)
    {
        var query = _context.Materials.AsQueryable();

        if (isActive.HasValue)
            query = query.Where(m => m.IsActive == isActive.Value);

        if (!string.IsNullOrEmpty(category))
            query = query.Where(m => m.Category == category);

        var materials = await query.OrderBy(m => m.Name).ToListAsync();
        return _mapper.Map<IEnumerable<MaterialDto>>(materials);
    }

    public async Task<MaterialDto> GetByIdAsync(Guid id)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material == null)
            throw new KeyNotFoundException($"Material with id {id} not found");

        return _mapper.Map<MaterialDto>(material);
    }

    public async Task<MaterialDto> CreateAsync(CreateMaterialDto dto)
    {
        var material = _mapper.Map<Material>(dto);
        material.IsActive = true;
        material.CreatedAt = DateTime.UtcNow;

        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        return _mapper.Map<MaterialDto>(material);
    }

    public async Task<MaterialDto> UpdateAsync(Guid id, UpdateMaterialDto dto)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material == null)
            throw new KeyNotFoundException($"Material with id {id} not found");

        _mapper.Map(dto, material);
        material.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return _mapper.Map<MaterialDto>(material);
    }

    public async Task DeleteAsync(Guid id)
    {
        var material = await _context.Materials.FindAsync(id);
        if (material == null)
            throw new KeyNotFoundException($"Material with id {id} not found");

        _context.Materials.Remove(material);
        await _context.SaveChangesAsync();
    }
}
