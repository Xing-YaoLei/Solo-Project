using Microsoft.EntityFrameworkCore;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.Services;

public class QuoteService : IQuoteService
{
    private readonly IAppDbContext _context;

    public QuoteService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<QuoteDto>> GetAllAsync(Guid? workOrderId = null)
    {
        var query = _context.Quotes
            .Include(q => q.WorkOrder)
            .Include(q => q.CreatedByUser)
            .Include(q => q.Items)
                .ThenInclude(i => i.Part)
            .Include(q => q.ReviewOpinions)
                .ThenInclude(r => r.ReviewerUser)
            .Include(q => q.ReviewOpinions)
                .ThenInclude(r => r.WorkOrder)
            .AsQueryable();

        if (workOrderId.HasValue)
        {
            query = query.Where(q => q.WorkOrderId == workOrderId.Value);
        }

        return await query
            .OrderByDescending(q => q.CreatedAt)
            .Select(q => MapToDto(q))
            .ToListAsync();
    }

    public async Task<QuoteDto?> GetByIdAsync(Guid id)
    {
        var quote = await _context.Quotes
            .Include(q => q.WorkOrder)
            .Include(q => q.CreatedByUser)
            .Include(q => q.Items)
                .ThenInclude(i => i.Part)
            .Include(q => q.ReviewOpinions)
                .ThenInclude(r => r.ReviewerUser)
            .Include(q => q.ReviewOpinions)
                .ThenInclude(r => r.WorkOrder)
            .Include(q => q.ReviewOpinions)
                .ThenInclude(r => r.Quote)
            .FirstOrDefaultAsync(q => q.Id == id);

        return quote != null ? MapToDto(quote) : null;
    }

    public async Task<QuoteDto> CreateAsync(QuoteCreateDto dto, string createdByUserId)
    {
        var quoteNumber = await GenerateQuoteNumberAsync();

        var quote = new Quote
        {
            Id = Guid.NewGuid(),
            QuoteNumber = quoteNumber,
            WorkOrderId = dto.WorkOrderId,
            CreatedByUserId = createdByUserId,
            Status = QuoteStatus.Draft,
            CustomerNotes = dto.CustomerNotes,
            InternalNotes = dto.InternalNotes,
            ValidUntil = dto.ValidUntil,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (dto.Items != null && dto.Items.Any())
        {
            foreach (var itemDto in dto.Items)
            {
                quote.Items.Add(new QuoteItem
                {
                    Id = Guid.NewGuid(),
                    ItemName = itemDto.ItemName,
                    Description = itemDto.Description,
                    Quantity = itemDto.Quantity,
                    UnitPrice = itemDto.UnitPrice,
                    LaborCost = itemDto.LaborCost,
                    IsPart = itemDto.IsPart,
                    PartId = itemDto.PartId
                });
            }
        }

        CalculateTotals(quote);

        _context.Quotes.Add(quote);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(quote.Id) ?? MapToDto(quote);
    }

    public async Task<QuoteDto?> UpdateStatusAsync(Guid id, QuoteStatus status)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return null;

        quote.Status = status;
        quote.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(quote.Id);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var quote = await _context.Quotes.FindAsync(id);
        if (quote == null) return false;

        _context.Quotes.Remove(quote);
        await _context.SaveChangesAsync();
        return true;
    }

    private static void CalculateTotals(Quote quote)
    {
        var partsTotal = 0m;
        var laborTotal = 0m;

        if (quote.Items != null)
        {
            foreach (var item in quote.Items)
            {
                if (item.IsPart)
                {
                    partsTotal += item.Quantity * item.UnitPrice;
                }
                laborTotal += item.Quantity * item.LaborCost;
            }
        }

        var subtotal = partsTotal + laborTotal;
        var tax = Math.Round(subtotal * 0.13m, 2);

        quote.PartsTotal = Math.Round(partsTotal, 2);
        quote.LaborTotal = Math.Round(laborTotal, 2);
        quote.Discount = 0m;
        quote.Tax = tax;
        quote.GrandTotal = Math.Round(subtotal - quote.Discount + tax, 2);
    }

    private async Task<string> GenerateQuoteNumberAsync()
    {
        var datePrefix = DateTime.Now.ToString("yyyyMMdd");
        var lastQuote = await _context.Quotes
            .Where(q => q.QuoteNumber.StartsWith("QT" + datePrefix))
            .OrderByDescending(q => q.QuoteNumber)
            .FirstOrDefaultAsync();

        int sequence = 1;
        if (lastQuote != null)
        {
            var lastSeqStr = lastQuote.QuoteNumber.Substring(10);
            if (int.TryParse(lastSeqStr, out var lastSeq))
            {
                sequence = lastSeq + 1;
            }
        }

        return $"QT{datePrefix}{sequence:D4}";
    }

    private static QuoteDto MapToDto(Quote q) => new()
    {
        Id = q.Id,
        QuoteNumber = q.QuoteNumber,
        WorkOrderId = q.WorkOrderId,
        WorkOrderNumber = q.WorkOrder?.OrderNumber ?? string.Empty,
        CreatedByUserId = q.CreatedByUserId,
        CreatedByUserName = q.CreatedByUser?.FullName ?? string.Empty,
        Status = q.Status,
        StatusText = q.Status.ToString(),
        PartsTotal = q.PartsTotal,
        LaborTotal = q.LaborTotal,
        Discount = q.Discount,
        Tax = q.Tax,
        GrandTotal = q.GrandTotal,
        CustomerNotes = q.CustomerNotes,
        InternalNotes = q.InternalNotes,
        ValidUntil = q.ValidUntil,
        CreatedAt = q.CreatedAt,
        Items = q.Items?.Select(i => new QuoteItemDto
        {
            Id = i.Id,
            ItemName = i.ItemName,
            Description = i.Description,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            LaborCost = i.LaborCost,
            IsPart = i.IsPart,
            PartId = i.PartId,
            PartName = i.Part?.Name
        }).ToList() ?? new List<QuoteItemDto>(),
        ReviewOpinions = q.ReviewOpinions?.Select(r => new ReviewOpinionDto
        {
            Id = r.Id,
            ReviewerUserId = r.ReviewerUserId,
            ReviewerUserName = r.ReviewerUser?.FullName ?? string.Empty,
            Opinion = r.Opinion,
            IsApproved = r.IsApproved,
            ReviewedAt = r.ReviewedAt
        }).ToList() ?? new List<ReviewOpinionDto>(),
        CommunicationLogs = new List<CommunicationLogDto>()
    };
}
