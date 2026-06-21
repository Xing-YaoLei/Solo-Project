using Microsoft.EntityFrameworkCore;
using TicketDesk.Domain.Enums;
using TicketDesk.Infrastructure.Data;

namespace TicketDesk.Infrastructure.Services;

public class StatisticsService
{
    private readonly TicketDeskDbContext _context;

    public StatisticsService(TicketDeskDbContext context)
    {
        _context = context;
    }

    public async Task<object> GetEventStatisticsAsync(Guid eventId)
    {
        var totalSeats = await _context.SeatMaps
            .Where(sm => sm.EventId == eventId)
            .SelectMany(sm => sm.Seats)
            .CountAsync();

        var soldSeats = await _context.SeatMaps
            .Where(sm => sm.EventId == eventId)
            .SelectMany(sm => sm.Seats)
            .CountAsync(s => s.Status == SeatStatus.Sold);

        var attendanceRate = totalSeats > 0 ? (decimal)soldSeats / totalSeats * 100 : 0;

        var ordersBySource = await _context.Orders
            .Where(o => o.EventId == eventId)
            .GroupBy(o => o.Source)
            .Select(g => new { Source = g.Key.ToString(), Count = g.Count() })
            .ToListAsync();

        var ordersByHandler = await _context.Orders
            .Where(o => o.EventId == eventId)
            .GroupBy(o => o.Handler)
            .Select(g => new { Handler = g.Key, Count = g.Count() })
            .ToListAsync();

        var disputeReasonSummary = await _context.Disputes
            .Where(d => d.Order.EventId == eventId)
            .GroupBy(d => d.Reason)
            .Select(g => new { Reason = g.Key.ToString(), Count = g.Count() })
            .ToListAsync();

        return new
        {
            TotalSeats = totalSeats,
            SoldSeats = soldSeats,
            AttendanceRate = attendanceRate,
            OrdersBySource = ordersBySource,
            OrdersByHandler = ordersByHandler,
            DisputeReasonSummary = disputeReasonSummary
        };
    }

    public async Task<object> GetDisputeSummaryAsync()
    {
        var totalDisputes = await _context.Disputes.CountAsync();

        var byStatus = await _context.Disputes
            .GroupBy(d => d.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count() })
            .ToListAsync();

        var byReason = await _context.Disputes
            .GroupBy(d => d.Reason)
            .Select(g => new { Reason = g.Key.ToString(), Count = g.Count() })
            .ToListAsync();

        var byHandler = await _context.Disputes
            .GroupBy(d => d.Handler)
            .Select(g => new { Handler = g.Key, Count = g.Count() })
            .ToListAsync();

        return new
        {
            TotalDisputes = totalDisputes,
            ByStatus = byStatus,
            ByReason = byReason,
            ByHandler = byHandler
        };
    }
}
