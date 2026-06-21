using CourierVerification.Data;
using CourierVerification.DTOs;
using CourierVerification.Enums;
using CourierVerification.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CourierVerification.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrdersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetList(int page = 1, int pageSize = 20)
    {
        try
        {
            var query = _context.Orders.OrderByDescending(o => o.CreatedAt);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new PagedResult<Order>
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var order = await _context.Orders
                .Include(o => o.Rider)
                .Include(o => o.VerificationRecords)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound("订单不存在");

            return Ok(order);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
    {
        try
        {
            var order = new Order
            {
                Id = Guid.NewGuid(),
                OrderNumber = dto.OrderNumber,
                PickupAddress = dto.PickupAddress,
                DeliveryAddress = dto.DeliveryAddress,
                SenderName = dto.SenderName,
                SenderPhone = dto.SenderPhone,
                ReceiverName = dto.ReceiverName,
                ReceiverPhone = dto.ReceiverPhone,
                PackageDescription = dto.PackageDescription,
                RiderId = dto.RiderId,
                Status = OrderStatus.Pending,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] CreateOrderDto dto)
    {
        try
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return NotFound("订单不存在");

            order.OrderNumber = dto.OrderNumber;
            order.PickupAddress = dto.PickupAddress;
            order.DeliveryAddress = dto.DeliveryAddress;
            order.SenderName = dto.SenderName;
            order.SenderPhone = dto.SenderPhone;
            order.ReceiverName = dto.ReceiverName;
            order.ReceiverPhone = dto.ReceiverPhone;
            order.PackageDescription = dto.PackageDescription;
            order.RiderId = dto.RiderId;
            order.UpdatedAt = DateTimeOffset.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(order);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return NotFound("订单不存在");

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"内部服务器错误: {ex.Message}");
        }
    }
}
