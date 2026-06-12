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
        _logger.LogInformation("开始扫描未取货异常工单: {Time}", DateTime.UtcNow);

        var cutoffTime = DateTime.UtcNow.AddHours(-24);

        var inspectedArrivalLists = await _context.ArrivalLists
            .Where(a => a.ArrivalStatus == ArrivalStatus.Inspected && a.CreatedAt < cutoffTime)
            .Include(a => a.Items)
            .ThenInclude(i => i.ProductTag)
            .Include(a => a.GroupBatch)
            .ToListAsync();

        if (!inspectedArrivalLists.Any())
        {
            _logger.LogInformation("未发现超过24小时未取货的到货清单");
            return;
        }

        var existingUncollectedOrders = await _context.ExceptionOrders
            .Where(e => e.ExceptionType == ExceptionType.Uncollected)
            .Select(e => new { e.ArrivalListId, e.ProductTagId })
            .ToListAsync();

        var existingSet = new HashSet<string>(
            existingUncollectedOrders.Select(x => $"{x.ArrivalListId}_{x.ProductTagId}"));

        var newOrders = new List<ExceptionOrder>();
        var orderIndex = 1;
        var today = DateTime.UtcNow.ToString("yyyyMMdd");

        foreach (var arrivalList in inspectedArrivalLists)
        {
            foreach (var item in arrivalList.Items)
            {
                var key = $"{arrivalList.Id}_{item.ProductTagId}";
                if (existingSet.Contains(key))
                    continue;

                if (item.ActualQty.HasValue && item.ActualQty.Value > 0)
                {
                    continue;
                }

                var orderNo = $"EX-{today}-{orderIndex:D4}";
                orderIndex++;

                var productName = item.ProductTag?.ProductName ?? "未知商品";
                var impactDesc = $"到货清单 {arrivalList.ListNo} 中的商品「{productName}」已验收超过24小时仍未取货,预计数量 {item.ExpectedQty}";

                var order = new ExceptionOrder
                {
                    OrderNo = orderNo,
                    GroupBatchId = arrivalList.GroupBatchId,
                    ArrivalListId = arrivalList.Id,
                    ProductTagId = item.ProductTagId,
                    ExceptionType = ExceptionType.Uncollected,
                    Severity = ExceptionSeverity.Medium,
                    ImpactDescription = impactDesc,
                    Responsibility = "待确认",
                    Resolution = ExceptionResolution.Pending,
                    CreatedAt = DateTime.UtcNow
                };

                newOrders.Add(order);
                existingSet.Add(key);
            }
        }

        if (newOrders.Any())
        {
            _context.ExceptionOrders.AddRange(newOrders);
            await _context.SaveChangesAsync();
            _logger.LogInformation("自动创建 {Count} 条未取货异常工单", newOrders.Count);
        }
        else
        {
            _logger.LogInformation("未发现新的未取货异常");
        }
    }
}
