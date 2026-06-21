using Microsoft.EntityFrameworkCore;
using TicketDesk.Domain.Entities;
using TicketDesk.Domain.Enums;
using TicketDesk.Infrastructure.Data;

namespace TicketDesk.Infrastructure.Services;

public class SeatMapService
{
    private readonly TicketDeskDbContext _context;

    public SeatMapService(TicketDeskDbContext context)
    {
        _context = context;
    }

    public async Task<SeatMap> CreateSeatMapAsync(Guid eventId, string name, string layoutJson)
    {
        var seatMap = new SeatMap
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            Name = name,
            LayoutJson = layoutJson,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.SeatMaps.Add(seatMap);
        await _context.SaveChangesAsync();
        return seatMap;
    }

    public async Task<SeatMap?> GetSeatMapWithSeatsAsync(Guid seatMapId)
    {
        return await _context.SeatMaps
            .Include(sm => sm.Seats)
            .FirstOrDefaultAsync(sm => sm.Id == seatMapId);
    }

    public async Task<Seat> UpdateSeatStatusAsync(Guid seatId, SeatStatus status)
    {
        var seat = (await _context.Seats.FindAsync(seatId))!;
        seat.Status = status;
        await _context.SaveChangesAsync();
        return seat;
    }

    public async Task<IReadOnlyList<Seat>> GetAvailableSeatsAsync(Guid seatMapId)
    {
        return await _context.Seats
            .Where(s => s.SeatMapId == seatMapId && s.Status == SeatStatus.Available)
            .ToListAsync();
    }
}
