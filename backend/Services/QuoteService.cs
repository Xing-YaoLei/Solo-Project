using Microsoft.EntityFrameworkCore;
using CarServiceAppointment.API.Data;
using CarServiceAppointment.API.DTOs;
using CarServiceAppointment.API.Models;

namespace CarServiceAppointment.API.Services;

public class QuoteService : IQuoteService
{
    private readonly AppointmentDbContext _context;

    public QuoteService(AppointmentDbContext context)
    {
        _context = context;
    }

    public async Task<QuoteDto> GetByIdAsync(int id)
    {
        var quote = await _context.Quotes
            .Include(q => q.Appointment)
            .Include(q => q.QuoteItems)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quote == null)
            throw new KeyNotFoundException($"报价单不存在: {id}");

        return MapToDto(quote);
    }

    public async Task<List<QuoteDto>> GetByAppointmentIdAsync(int appointmentId)
    {
        var quotes = await _context.Quotes
            .Include(q => q.Appointment)
            .Include(q => q.QuoteItems)
            .Where(q => q.AppointmentId == appointmentId)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        return quotes.Select(MapToDto).ToList();
    }

    public async Task<QuoteDto> CreateAsync(CreateQuoteDto dto)
    {
        var appointment = await _context.Appointments.FindAsync(dto.AppointmentId);
        if (appointment == null)
            throw new KeyNotFoundException($"预约单不存在: {dto.AppointmentId}");

        var quote = new Quote
        {
            AppointmentId = dto.AppointmentId,
            Status = QuoteStatus.Draft,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        decimal laborCost = 0;
        decimal partsCost = 0;

        foreach (var itemDto in dto.QuoteItems)
        {
            var item = new QuoteItem
            {
                Name = itemDto.Name,
                Type = itemDto.Type,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                Subtotal = itemDto.Quantity * itemDto.UnitPrice,
                Remarks = itemDto.Remarks,
                CreatedAt = DateTime.Now
            };

            quote.QuoteItems.Add(item);

            if (itemDto.Type == QuoteItemType.Labor)
                laborCost += item.Subtotal;
            else
                partsCost += item.Subtotal;
        }

        quote.LaborCost = laborCost;
        quote.PartsCost = partsCost;
        quote.TotalAmount = laborCost + partsCost;

        _context.Quotes.Add(quote);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(quote.Id);
    }

    public async Task<QuoteDto> UpdateAsync(int id, UpdateQuoteDto dto)
    {
        var quote = await _context.Quotes
            .Include(q => q.QuoteItems)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quote == null)
            throw new KeyNotFoundException($"报价单不存在: {id}");

        if (quote.Status != QuoteStatus.Draft)
            throw new InvalidOperationException("只有草稿状态的报价单才能修改");

        quote.Remarks = dto.Remarks;
        quote.UpdatedAt = DateTime.Now;

        _context.QuoteItems.RemoveRange(quote.QuoteItems);
        quote.QuoteItems.Clear();

        decimal laborCost = 0;
        decimal partsCost = 0;

        foreach (var itemDto in dto.QuoteItems)
        {
            var item = new QuoteItem
            {
                Name = itemDto.Name,
                Type = itemDto.Type,
                Quantity = itemDto.Quantity,
                UnitPrice = itemDto.UnitPrice,
                Subtotal = itemDto.Quantity * itemDto.UnitPrice,
                Remarks = itemDto.Remarks,
                CreatedAt = DateTime.Now
            };

            quote.QuoteItems.Add(item);

            if (itemDto.Type == QuoteItemType.Labor)
                laborCost += item.Subtotal;
            else
                partsCost += item.Subtotal;
        }

        quote.LaborCost = laborCost;
        quote.PartsCost = partsCost;
        quote.TotalAmount = laborCost + partsCost;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<QuoteDto> ConfirmAsync(int id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null)
            throw new KeyNotFoundException($"报价单不存在: {id}");

        if (quote.Status != QuoteStatus.Draft)
            throw new InvalidOperationException("只有草稿状态的报价单才能确认");

        quote.Status = QuoteStatus.Confirmed;
        quote.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<QuoteDto> RejectAsync(int id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null)
            throw new KeyNotFoundException($"报价单不存在: {id}");

        if (quote.Status != QuoteStatus.Draft)
            throw new InvalidOperationException("只有草稿状态的报价单才能拒绝");

        quote.Status = QuoteStatus.Rejected;
        quote.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task DeleteAsync(int id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null)
            throw new KeyNotFoundException($"报价单不存在: {id}");

        if (quote.Status != QuoteStatus.Draft && quote.Status != QuoteStatus.Rejected)
            throw new InvalidOperationException("只有草稿或已拒绝状态的报价单才能删除");

        _context.Quotes.Remove(quote);
        await _context.SaveChangesAsync();
    }

    private static QuoteDto MapToDto(Quote quote)
    {
        var dto = new QuoteDto
        {
            Id = quote.Id,
            AppointmentId = quote.AppointmentId,
            LaborCost = quote.LaborCost,
            PartsCost = quote.PartsCost,
            TotalAmount = quote.TotalAmount,
            Status = quote.Status,
            Remarks = quote.Remarks,
            CreatedAt = quote.CreatedAt,
            UpdatedAt = quote.UpdatedAt
        };

        if (quote.Appointment != null)
        {
            dto.AppointmentNo = quote.Appointment.AppointmentNo;
        }

        if (quote.QuoteItems != null)
        {
            dto.QuoteItems = quote.QuoteItems.Select(item => new QuoteItemDto
            {
                Id = item.Id,
                Name = item.Name,
                Type = item.Type,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                Subtotal = item.Subtotal,
                Remarks = item.Remarks
            }).ToList();
        }

        return dto;
    }
}
