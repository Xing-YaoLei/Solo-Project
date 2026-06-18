using Microsoft.EntityFrameworkCore;
using AutoRepair.Application.DTOs;
using AutoRepair.Application.Interfaces;
using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.Services;

public class CommunicationLogService : ICommunicationLogService
{
    private readonly IAppDbContext _context;

    public CommunicationLogService(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<CommunicationLogDto>> GetByEntityAsync(Guid? stockAlertId = null, Guid? quoteId = null, Guid? workOrderId = null)
    {
        var query = _context.CommunicationLogs
            .Include(c => c.FromUser)
            .Include(c => c.ToUser)
            .AsQueryable();

        if (stockAlertId.HasValue)
        {
            query = query.Where(c => c.StockAlertId == stockAlertId.Value);
        }

        if (quoteId.HasValue)
        {
            query = query.Where(c => c.QuoteId == quoteId.Value);
        }

        if (workOrderId.HasValue)
        {
            query = query.Where(c => c.WorkOrderId == workOrderId.Value);
        }

        return await query
            .OrderBy(c => c.SentAt)
            .Select(c => MapToDto(c))
            .ToListAsync();
    }

    public async Task<CommunicationLogDto> CreateAsync(CommunicationLogCreateDto dto, string fromUserId)
    {
        var communicationLog = new CommunicationLog
        {
            Id = Guid.NewGuid(),
            StockAlertId = dto.StockAlertId,
            QuoteId = dto.QuoteId,
            WorkOrderId = dto.WorkOrderId,
            FromUserId = fromUserId,
            ToUserId = dto.ToUserId,
            Message = dto.Message,
            AttachmentUrl = dto.AttachmentUrl,
            SentAt = DateTime.UtcNow
        };

        _context.CommunicationLogs.Add(communicationLog);
        await _context.SaveChangesAsync();

        var saved = await _context.CommunicationLogs
            .Include(c => c.FromUser)
            .Include(c => c.ToUser)
            .FirstOrDefaultAsync(c => c.Id == communicationLog.Id);

        return MapToDto(saved ?? communicationLog);
    }

    private static CommunicationLogDto MapToDto(CommunicationLog c) => new()
    {
        Id = c.Id,
        FromUserId = c.FromUserId,
        FromUserName = c.FromUser?.FullName ?? string.Empty,
        ToUserId = c.ToUserId,
        ToUserName = c.ToUser?.FullName,
        Message = c.Message,
        AttachmentUrl = c.AttachmentUrl,
        SentAt = c.SentAt
    };
}
