using Microsoft.EntityFrameworkCore;
using TicketDesk.Domain.Entities;
using TicketDesk.Domain.Enums;
using TicketDesk.Infrastructure.Data;

namespace TicketDesk.Infrastructure.Services;

public class OrderService
{
    private readonly TicketDeskDbContext _context;

    public OrderService(TicketDeskDbContext context)
    {
        _context = context;
    }

    public async Task<Order> CreateOrderAsync(Guid eventId, Guid seatId, Guid ticketTypeId, string buyerName, string buyerContact, OrderSource source, string handler)
    {
        var ticketType = await _context.TicketTypes.FindAsync(ticketTypeId);
        var order = new Order
        {
            Id = Guid.NewGuid(),
            EventId = eventId,
            SeatId = seatId,
            TicketTypeId = ticketTypeId,
            OrderNumber = "ORD-" + DateTime.UtcNow.Ticks,
            Source = source,
            BuyerName = buyerName,
            BuyerContact = buyerContact,
            TotalAmount = ticketType.Price,
            Status = DocumentStatus.Draft,
            Handler = handler,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();
        return order;
    }

    public async Task<Order?> GetOrderWithDetailsAsync(Guid orderId)
    {
        return await _context.Orders
            .Include(o => o.Event)
            .Include(o => o.Seat)
            .Include(o => o.TicketType)
            .Include(o => o.Disputes)
            .FirstOrDefaultAsync(o => o.Id == orderId);
    }

    public async Task<Order> UpdateOrderStatusAsync(Guid orderId, DocumentStatus status)
    {
        var order = await _context.Orders.FindAsync(orderId);
        order.Status = status;
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return order;
    }

    public async Task<IReadOnlyList<Order>> GetOrdersByEventAsync(Guid eventId)
    {
        return await _context.Orders
            .Where(o => o.EventId == eventId)
            .ToListAsync();
    }

    public async Task CloseOrderAsync(Guid orderId)
    {
        var order = await _context.Orders.Include(o => o.Seat).FirstAsync(o => o.Id == orderId);
        order.Status = DocumentStatus.Closed;
        order.ClosedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;
        order.Seat.Status = SeatStatus.Available;
        await _context.SaveChangesAsync();
    }
}
