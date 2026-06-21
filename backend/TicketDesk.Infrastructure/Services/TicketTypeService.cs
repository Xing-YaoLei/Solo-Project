using Microsoft.EntityFrameworkCore;
using TicketDesk.Domain.Entities;
using TicketDesk.Infrastructure.Data;

namespace TicketDesk.Infrastructure.Services;

public class TicketTypeService
{
    private readonly TicketDeskDbContext _context;

    public TicketTypeService(TicketDeskDbContext context)
    {
        _context = context;
    }

    public async Task<TicketType> CreateTicketTypeAsync(Guid eventId, string name, decimal price, int quota, string rulesJson)
    {
        var ticketType = new TicketType
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            Name = name,
            Price = price,
            Quota = quota,
            RulesJson = rulesJson,
            CreatedAt = DateTime.UtcNow
        };
        _context.TicketTypes.Add(ticketType);
        await _context.SaveChangesAsync();
        return ticketType;
    }

    public async Task<TicketType?> GetByIdAsync(Guid id)
    {
        return await _context.TicketTypes.FindAsync(id);
    }

    public async Task<IReadOnlyList<TicketType>> GetByEventAsync(Guid eventId)
    {
        return await _context.TicketTypes
            .Where(t => t.EventId == eventId)
            .ToListAsync();
    }

    public async Task<TicketType> UpdateTicketTypeAsync(Guid id, string name, decimal price, int quota, string rulesJson)
    {
        var ticketType = await _context.TicketTypes.FindAsync(id);
        ticketType.Name = name;
        ticketType.Price = price;
        ticketType.Quota = quota;
        ticketType.RulesJson = rulesJson;
        await _context.SaveChangesAsync();
        return ticketType;
    }
}
