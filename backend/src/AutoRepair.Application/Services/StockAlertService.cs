using Microsoft.EntityFrameworkCore;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.Services;

public class StockAlertService : IStockAlertService
{
    private readonly IAppDbContext _context;

    public StockAlertService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<StockAlertDto>> GetAllAsync(bool? acknowledged = null)
    {
        var query = _context.StockAlerts
            .Include(s => s.PartInventory)
                .ThenInclude(i => i!.Part)
            .Include(s => s.AcknowledgedByUser)
            .Include(s => s.CommunicationLogs)
                .ThenInclude(c => c.FromUser)
            .Include(s => s.CommunicationLogs)
                .ThenInclude(c => c.ToUser)
            .AsQueryable();

        if (acknowledged.HasValue)
        {
            query = query.Where(s => s.IsAcknowledged == acknowledged.Value);
        }

        return await query
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<StockAlertDto?> GetByIdAsync(Guid id)
    {
        var alert = await _context.StockAlerts
            .Include(s => s.PartInventory)
                .ThenInclude(i => i!.Part)
            .Include(s => s.AcknowledgedByUser)
            .Include(s => s.CommunicationLogs)
                .ThenInclude(c => c.FromUser)
            .Include(s => s.CommunicationLogs)
                .ThenInclude(c => c.ToUser)
            .FirstOrDefaultAsync(s => s.Id == id);

        return alert != null ? MapToDto(alert) : null;
    }

    public async Task AcknowledgeAsync(Guid id, string userId)
    {
        var alert = await _context.StockAlerts.FindAsync(id);
        if (alert == null || alert.IsAcknowledged) return;

        alert.IsAcknowledged = true;
        alert.AcknowledgedAt = DateTime.UtcNow;
        alert.AcknowledgedByUserId = userId;

        await _context.SaveChangesAsync();
    }

    public async Task CheckStockLevelsAndGenerateAlertsAsync()
    {
        var inventories = await _context.PartInventories
            .Include(i => i.Part)
            .Include(i => i.StockAlerts)
            .ToListAsync();

        foreach (var inventory in inventories)
        {
            var availableQuantity = inventory.QuantityInStock - inventory.ReservedQuantity;
            var riskLevel = CalculateRiskLevel(availableQuantity, inventory.ReorderLevel);

            if (riskLevel == RiskLevel.None)
            {
                continue;
            }

            var existingAlert = inventory.StockAlerts
                .FirstOrDefault(a => !a.IsAcknowledged);

            if (existingAlert != null)
            {
                if (existingAlert.RiskLevel != riskLevel)
                {
                    existingAlert.RiskLevel = riskLevel;
                    existingAlert.AlertMessage = GenerateAlertMessage(inventory, riskLevel, availableQuantity);
                }
            }
            else
            {
                var alert = new StockAlert
                {
                    Id = Guid.NewGuid(),
                    PartInventoryId = inventory.Id,
                    RiskLevel = riskLevel,
                    AlertMessage = GenerateAlertMessage(inventory, riskLevel, availableQuantity),
                    IsAcknowledged = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.StockAlerts.Add(alert);
            }
        }

        await _context.SaveChangesAsync();
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

    private static string GenerateAlertMessage(PartInventory inventory, RiskLevel riskLevel, int availableQuantity)
    {
        var partName = inventory.Part?.Name ?? "未知配件";
        var partNumber = inventory.Part?.PartNumber ?? "N/A";

        return riskLevel switch
        {
            RiskLevel.Low => $"配件 [{partName} ({partNumber})] 库存偏低，当前可用 {availableQuantity}，建议备货量 {inventory.ReorderLevel}",
            RiskLevel.Medium => $"配件 [{partName} ({partNumber})] 库存不足，当前可用 {availableQuantity}，已低于建议备货量 {inventory.ReorderLevel}",
            RiskLevel.High => $"配件 [{partName} ({partNumber})] 库存严重不足，当前可用 {availableQuantity}，紧急需要补货",
            RiskLevel.Critical => $"配件 [{partName} ({partNumber})] 库存已缺货，当前可用 {availableQuantity}，请立即安排采购",
            _ => string.Empty
        };
    }

    private static StockAlertDto MapToDto(StockAlert s) => new()
    {
        Id = s.Id,
        PartInventoryId = s.PartInventoryId,
        PartName = s.PartInventory?.Part?.Name ?? string.Empty,
        PartNumber = s.PartInventory?.Part?.PartNumber ?? string.Empty,
        RiskLevel = s.RiskLevel,
        RiskLevelText = s.RiskLevel.ToString(),
        AlertMessage = s.AlertMessage,
        IsAcknowledged = s.IsAcknowledged,
        CreatedAt = s.CreatedAt,
        AcknowledgedAt = s.AcknowledgedAt,
        CommunicationLogs = s.CommunicationLogs?.Select(c => new CommunicationLogDto
        {
            Id = c.Id,
            FromUserId = c.FromUserId,
            FromUserName = c.FromUser?.FullName ?? string.Empty,
            ToUserId = c.ToUserId,
            ToUserName = c.ToUser?.FullName,
            Message = c.Message,
            AttachmentUrl = c.AttachmentUrl,
            SentAt = c.SentAt
        }).ToList() ?? new List<CommunicationLogDto>()
    };
}
