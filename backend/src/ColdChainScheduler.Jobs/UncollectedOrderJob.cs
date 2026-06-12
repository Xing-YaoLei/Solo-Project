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
                    .ThenInclude(g => g.LeaderTier)
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

        var leaderStatsCache = new Dictionary<int, (int TotalBatches, int UncollectedCount)>();

        foreach (var item in overdueItems)
        {
            var key = $"{item.ArrivalListId}_{item.ProductTagId}";
            if (existingSet.Contains(key))
                continue;

            item.PickupStatus = PickupStatus.OverdueUncollected;

            var orderNo = $"EX-{today}-{orderIndex:D4}";
            orderIndex++;

            var batch = item.ArrivalList?.GroupBatch;
            var batchName = batch?.BatchName ?? "未知批次";
            var batchNo = batch?.BatchNo ?? string.Empty;
            var leaderName = batch?.LeaderName ?? "未知团长";
            var leaderPhone = batch?.LeaderPhone ?? string.Empty;
            var leaderTierName = batch?.LeaderTier?.TierName ?? "普通团长";
            var productName = item.ProductTag?.ProductName ?? "未知商品";
            var storageTemp = item.ProductTag != null && item.ProductTag.StorageTempMin.HasValue
                ? $"{item.ProductTag.StorageTempMin}~{item.ProductTag.StorageTempMax}°C"
                : "冷藏";
            var overdueHours = (int)Math.Floor((DateTime.UtcNow - item.ArrivalList.CreatedAt).TotalHours);
            var quantity = item.ActualQty ?? item.ExpectedQty;
            var unitPrice = item.ProductTag?.UnitPrice ?? 0;
            var totalAmount = quantity * unitPrice;

            var leaderId = batch?.LeaderTierId ?? 0;
            if (!leaderStatsCache.ContainsKey(leaderId) && batch != null)
            {
                var leaderBatchIds = await _context.GroupBatches
                    .Where(g => g.LeaderTierId == batch.LeaderTierId)
                    .Select(g => g.Id)
                    .ToListAsync();
                var uncollectedCount = await _context.ExceptionOrders
                    .CountAsync(e => e.ExceptionType == ExceptionType.Uncollected
                        && leaderBatchIds.Contains(e.GroupBatchId));
                leaderStatsCache[leaderId] = (leaderBatchIds.Count, uncollectedCount);
            }

            var stats = leaderStatsCache.TryGetValue(leaderId, out var s) ? s : (0, 0);
            var uncollectedRate = stats.TotalBatches > 0
                ? Math.Round((double)stats.UncollectedCount / stats.TotalBatches * 100, 1)
                : 0;

            var impactDesc = $"【自动生成】自提超时触发异常：批次「{batchName}」({batchNo}) 商品「{productName}」" +
                $"数量 {quantity} 件（价值 ¥{totalAmount:F2}，存储条件：{storageTemp}），" +
                $"验收后已超时 {overdueHours} 小时仍处于待自提状态。涉及团长：{leaderName}（{leaderTierName}）。" +
                $"该团长历史批次 {stats.TotalBatches} 次，未自提异常率 {uncollectedRate}%。";

            var responsibility = $"责任归属：经系统分析，本次未自提初步判定责任方为团长「{leaderName}」" +
                $"(联系电话：{leaderPhone ?? "未登记"})。依据：1）到货清单已验收超过 24 小时；2）自提状态始终为「待自提」" +
                $"说明团长未完成通知义务；3）该团长历史未自提异常率为 {uncollectedRate}%，" +
                $"{'高于' if (uncollectedRate > 10) else '处于'}正常水平。" +
                $"如后续核实为用户原因，可在处理时更新责任归属。";

            var resolutionNotes = $"建议处理方案：1）立即联系团长 {leaderName}（{leaderPhone ?? "无电话"}）核实未通知原因；" +
                $"2）由团长联系用户确认是否仍需该商品（{productName}，{quantity} 件）；" +
                $"3）如用户仍需商品，需在 2 小时内安排补发并更新处理方式为「补发」；" +
                $"4）如用户放弃或联系不上，商品作丢弃处理，由责任方承担损失 ¥{totalAmount:F2}；" +
                $"5）全部处理完成后填写处理人并归档。";

            var severity = (uncollectedRate > 20 || totalAmount > 500)
                ? ExceptionSeverity.High
                : ExceptionSeverity.Medium;

            var order = new ExceptionOrder
            {
                OrderNo = orderNo,
                GroupBatchId = item.ArrivalList.GroupBatchId,
                ArrivalListId = item.ArrivalListId,
                ProductTagId = item.ProductTagId,
                ExceptionType = ExceptionType.Uncollected,
                Severity = severity,
                ImpactDescription = impactDesc,
                Responsibility = responsibility,
                Resolution = ExceptionResolution.Pending,
                ResolutionNotes = resolutionNotes,
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
