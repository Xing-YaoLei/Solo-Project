using Microsoft.EntityFrameworkCore;
using CarServiceAppointment.API.Data;

namespace CarServiceAppointment.API.BackgroundJobs;

public class PartsInventoryJob
{
    private readonly AppointmentDbContext _context;
    private readonly ILogger<PartsInventoryJob> _logger;

    public PartsInventoryJob(AppointmentDbContext context, ILogger<PartsInventoryJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task CheckLowInventoryAsync()
    {
        _logger.LogInformation("开始检查配件库存预警...");

        try
        {
            var lowStockParts = await _context.Parts
                .Where(p => p.StockQuantity < p.SafetyStock)
                .OrderBy(p => p.StockQuantity)
                .ToListAsync();

            if (lowStockParts.Any())
            {
                _logger.LogWarning("发现 {Count} 个低库存配件需要补货预警：", lowStockParts.Count);
                foreach (var part in lowStockParts)
                {
                    _logger.LogWarning("  - {Name} ({PartNumber}): 库存 {Stock}, 安全库存 {SafetyStock}, 缺口 {Shortage}",
                        part.Name, part.PartNumber, part.StockQuantity, part.SafetyStock,
                        part.SafetyStock - part.StockQuantity);
                }
            }
            else
            {
                _logger.LogInformation("所有配件库存充足，无需预警");
            }

            _logger.LogInformation("配件库存检查完成");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "配件库存检查过程中发生错误");
            throw;
        }
    }
}
