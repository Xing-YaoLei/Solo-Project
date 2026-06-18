using Microsoft.EntityFrameworkCore;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IAppDbContext _context;

    public DashboardService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var today = DateTime.Today;
        var start = startDate ?? new DateTime(today.Year, today.Month, 1);
        var end = endDate ?? today.AddDays(1).AddTicks(-1);

        var todayStart = today.Date;
        var todayEnd = today.AddDays(1).AddTicks(-1);

        var todayPendingOrders = await _context.WorkOrders
            .CountAsync(w => w.ScheduledDate >= todayStart
                && w.ScheduledDate <= todayEnd
                && w.Status == WorkOrderStatus.Pending);

        var todayInProgress = await _context.WorkOrders
            .CountAsync(w => w.ScheduledDate >= todayStart
                && w.ScheduledDate <= todayEnd
                && w.Status == WorkOrderStatus.InProgress);

        var todayCompleted = await _context.WorkOrders
            .CountAsync(w => w.CompletedAt >= todayStart
                && w.CompletedAt <= todayEnd
                && w.Status == WorkOrderStatus.Completed);

        var lowStockAlerts = await _context.StockAlerts
            .CountAsync(s => !s.IsAcknowledged
                && (s.RiskLevel == RiskLevel.Low || s.RiskLevel == RiskLevel.Medium));

        var criticalStockAlerts = await _context.StockAlerts
            .CountAsync(s => !s.IsAcknowledged
                && (s.RiskLevel == RiskLevel.High || s.RiskLevel == RiskLevel.Critical));

        var monthStart = new DateTime(today.Year, today.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddTicks(-1);

        var monthTotalOrders = await _context.WorkOrders
            .CountAsync(w => w.CreatedAt >= monthStart && w.CreatedAt <= monthEnd);

        var monthReworkOrders = await _context.WorkOrders
            .CountAsync(w => w.CreatedAt >= monthStart
                && w.CreatedAt <= monthEnd
                && (w.IsRework || w.Status == WorkOrderStatus.Rework));

        var thisMonthReworkRate = monthTotalOrders > 0
            ? (int)Math.Round((decimal)monthReworkOrders / monthTotalOrders * 100)
            : 0;

        var reworkTrend = await GetReworkTrendAsync(6);

        return new DashboardStatsDto
        {
            TodayPendingOrders = todayPendingOrders,
            TodayInProgress = todayInProgress,
            TodayCompleted = todayCompleted,
            LowStockAlerts = lowStockAlerts,
            CriticalStockAlerts = criticalStockAlerts,
            ThisMonthReworkRate = thisMonthReworkRate,
            ReworkTrend = reworkTrend.ToList()
        };
    }

    public async Task<IEnumerable<ReworkRateDto>> GetReworkTrendAsync(int months = 6)
    {
        var today = DateTime.Today;
        var trend = new List<ReworkRateDto>();

        for (int i = months - 1; i >= 0; i--)
        {
            var monthDate = new DateTime(today.Year, today.Month, 1).AddMonths(-i);
            var monthStart = monthDate;
            var monthEnd = monthDate.AddMonths(1).AddTicks(-1);

            var totalOrders = await _context.WorkOrders
                .CountAsync(w => w.CreatedAt >= monthStart && w.CreatedAt <= monthEnd);

            var reworkOrders = await _context.WorkOrders
                .CountAsync(w => w.CreatedAt >= monthStart
                    && w.CreatedAt <= monthEnd
                    && (w.IsRework || w.Status == WorkOrderStatus.Rework));

            var reworkRate = totalOrders > 0
                ? Math.Round((decimal)reworkOrders / totalOrders * 100, 2)
                : 0;

            trend.Add(new ReworkRateDto
            {
                Date = monthDate,
                TotalOrders = totalOrders,
                ReworkOrders = reworkOrders,
                ReworkRate = reworkRate
            });
        }

        return trend;
    }
}
