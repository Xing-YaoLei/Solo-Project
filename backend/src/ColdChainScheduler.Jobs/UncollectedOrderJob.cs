using ColdChainScheduler.Domain.Entities;
using ColdChainScheduler.Domain.Enums;
using ColdChainScheduler.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ColdChainScheduler.Jobs;

public class UncollectedOrderJob
{
    private readonly AppDbContext _context;
    private readonly ILogger<UncollectedOrderJob> _logger;

    public UncollectedOrderJob(AppDbContext context, ILogger<UncollectedOrderJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("开始扫描超时未取货异常工单: {Time}", DateTime.UtcNow);

        var cutoffTime = DateTime.UtcNow.AddHours(-24);

        var overdueItems = await _context.ArrivalListItems
            .Where(i => i.PickupStatus == PickupStatus.PendingPickup)
            .Include(i => i.ArrivalList)
                .ThenInclude(a => a.GroupBatch)
            .Include(i => i.ProductTag)
            .Where(i => i.ArrivalList.CreatedAt < cutoffTime)
            .ToListAsync();

        if (!overdueItems.Any())
        {
            _logger.LogInformation("未发现超时未取货的商品");
            return;
        }

        var existingUncollectedOrders = await _context.ExceptionOrders
            .Where(e => e.ExceptionType == ExceptionType.Uncollected)
            .Select(e => new { e.ArrivalListId, e.ProductTagId })
            .ToListAsync();

        var existingSet = new HashSet<string>(
            existingUncollectedOrders.Select(x => $"{x.ArrivalListId}_{x.ProductTagId}"));

        var newOrders = new List<ExceptionOrder>();
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var maxOrderNoSuffix = await _context.ExceptionOrders
            .Where(e => e.OrderNo.StartsWith($"EX-{today}-"))
            .Select(e => e.OrderNo)
            .OrderByDescending(n => n)
            .FirstOrDefaultAsync();

        var orderIndex = 1;
        if (!string.IsNullOrEmpty(maxOrderNoSuffix))
        {
            var suffixPart = maxOrderNoSuffix.Substring($"EX-{today}-".Length);
            if (int.TryParse(suffixPart, out var parsedIndex))
            {
                orderIndex = parsedIndex + 1;
            }
        }

        foreach (var item in overdueItems)
        {
            var key = $"{item.ArrivalListId}_{item.ProductTagId}";
            if (existingSet.Contains(key))
                continue;

            item.PickupStatus = PickupStatus.OverdueUncollected;

            var orderNo = $"EX-{today}-{orderIndex:D4}";
            orderIndex++;

            var batchName = item.ArrivalList?.GroupBatch?.BatchName ?? "未知批次";
            var batchNo = item.ArrivalList?.GroupBatch?.BatchNo ?? string.Empty;
            var productName = item.ProductTag?.ProductName ?? "未知商品";
            var overdueHours = (int)Math.Floor((DateTime.UtcNow - item.ArrivalList.CreatedAt).TotalHours);
            var quantity = item.ActualQty ?? item.ExpectedQty;

            var impactDesc = $"【自动生成】批次「{batchName}」({batchNo}) 商品「{productName}」数量 {quantity} 件，已超时 {overdueHours} 小时未自提";

            var order = new ExceptionOrder
            {
                OrderNo = orderNo,
                GroupBatchId = item.ArrivalList.GroupBatchId,
                ArrivalListId = item.ArrivalListId,
                ProductTagId = item.ProductTagId,
                ExceptionType = ExceptionType.Uncollected,
                Severity = ExceptionSeverity.Medium,
                ImpactDescription = impactDesc,
                Responsibility = "待排查：可能是团长通知不到位或用户临时取消",
                Resolution = ExceptionResolution.Pending,
                ResolutionNotes = string.Empty,
                CreatedAt = DateTime.UtcNow
            };

            newOrders.Add(order);
            existingSet.Add(key);
        }

        if (newOrders.Any())
        {
            _context.ExceptionOrders.AddRange(newOrders);
            await _context.SaveChangesAsync();
            _logger.LogInformation("自动标记 {Count} 条商品为超时未取货，并创建对应异常工单", newOrders.Count);
        }
        else
        {
            _logger.LogInformation("未发现新的超时未取货异常");
        }
    }
}
