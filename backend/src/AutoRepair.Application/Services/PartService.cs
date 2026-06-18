using Microsoft.EntityFrameworkCore;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.Services;

public class PartService : IPartService
{
    private readonly IAppDbContext _context;

    public PartService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<PartDto>> GetAllAsync(string? category = null, bool? lowStockOnly = null)
    {
        var query = _context.Parts
            .Include(p => p.Inventory)
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(p => p.Category == category);
        }

        var parts = await query
            .OrderBy(p => p.Name)
            .ToListAsync();

        var partDtos = parts.Select(p => MapToDto(p)).AsEnumerable();

        if (lowStockOnly == true)
        {
            partDtos = partDtos.Where(p => p.RiskLevel != RiskLevel.None);
        }

        return partDtos.ToList();
    }

    public async Task<PartDto?> GetByIdAsync(Guid id)
    {
        var part = await _context.Parts
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.Id == id);

        return part != null ? MapToDto(part) : null;
    }

    public async Task<PartDto> CreateAsync(PartCreateDto dto)
    {
        var part = new Part
        {
            Id = Guid.NewGuid(),
            PartNumber = dto.PartNumber,
            Name = dto.Name,
            Brand = dto.Brand,
            Specification = dto.Specification,
            Category = dto.Category,
            UnitPrice = dto.UnitPrice,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        part.Inventory = new PartInventory
        {
            Id = Guid.NewGuid(),
            PartId = part.Id,
            QuantityInStock = dto.InitialStock,
            ReservedQuantity = 0,
            ReorderLevel = dto.ReorderLevel,
            Location = dto.Location,
            LastUpdatedAt = DateTime.UtcNow
        };

        _context.Parts.Add(part);
        await _context.SaveChangesAsync();

        return MapToDto(part);
    }

    public async Task<PartDto?> UpdateAsync(Guid id, PartUpdateDto dto)
    {
        var part = await _context.Parts
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (part == null) return null;

        if (dto.Name != null) part.Name = dto.Name;
        if (dto.Brand != null) part.Brand = dto.Brand;
        if (dto.Specification != null) part.Specification = dto.Specification;
        if (dto.Category != null) part.Category = dto.Category;
        if (dto.UnitPrice.HasValue) part.UnitPrice = dto.UnitPrice.Value;

        if (part.Inventory != null)
        {
            if (dto.ReorderLevel.HasValue) part.Inventory.ReorderLevel = dto.ReorderLevel.Value;
            if (dto.Location != null) part.Inventory.Location = dto.Location;
            part.Inventory.LastUpdatedAt = DateTime.UtcNow;
        }

        part.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return MapToDto(part);
    }

    public async Task<PartDto?> UpdateStockAsync(Guid id, int quantityChange)
    {
        var part = await _context.Parts
            .Include(p => p.Inventory)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (part == null || part.Inventory == null) return null;

        part.Inventory.QuantityInStock += quantityChange;
        if (part.Inventory.QuantityInStock < 0)
        {
            part.Inventory.QuantityInStock = 0;
        }
        part.Inventory.LastUpdatedAt = DateTime.UtcNow;
        part.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToDto(part);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var part = await _context.Parts.FindAsync(id);
        if (part == null) return false;

        _context.Parts.Remove(part);
        await _context.SaveChangesAsync();
        return true;
    }

    private static RiskLevel CalculateRiskLevel(int availableQuantity, int reorderLevel)
    {
        if (reorderLevel <= 0) return RiskLevel.None;

        if (availableQuantity <= 0) return RiskLevel.Critical;
        if (availableQuantity <= reorderLevel * 0.5m) return RiskLevel.High;
        if (availableQuantity <= reorderLevel) return RiskLevel.Medium;
        if (availableQuantity <= reorderLevel * 2) return RiskLevel.Low;
        return RiskLevel.None;
    }

    private static PartDto MapToDto(Part p)
    {
        var inventory = p.Inventory;
        var quantityInStock = inventory?.QuantityInStock ?? 0;
        var reservedQuantity = inventory?.ReservedQuantity ?? 0;
        var reorderLevel = inventory?.ReorderLevel ?? 0;
        var availableQuantity = quantityInStock - reservedQuantity;
        var riskLevel = CalculateRiskLevel(availableQuantity, reorderLevel);

        return new PartDto
        {
            Id = p.Id,
            PartNumber = p.PartNumber,
            Name = p.Name,
            Brand = p.Brand,
            Specification = p.Specification,
            Category = p.Category,
            UnitPrice = p.UnitPrice,
            QuantityInStock = quantityInStock,
            ReservedQuantity = reservedQuantity,
            AvailableQuantity = availableQuantity,
            ReorderLevel = reorderLevel,
            RiskLevel = riskLevel,
            RiskLevelText = riskLevel.ToString()
        };
    }
}
