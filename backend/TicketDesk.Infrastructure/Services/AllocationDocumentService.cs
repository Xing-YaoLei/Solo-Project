using Microsoft.EntityFrameworkCore;
using TicketDesk.Domain.Entities;
using TicketDesk.Domain.Enums;
using TicketDesk.Infrastructure.Data;

namespace TicketDesk.Infrastructure.Services;

public class AllocationDocumentService
{
    private readonly TicketDeskDbContext _context;

    public AllocationDocumentService(TicketDeskDbContext context)
    {
        _context = context;
    }

    public async Task<AllocationDocument> CreateDocumentAsync(Guid eventId, string handler, string notes)
    {
        var document = new AllocationDocument
        {
            Id = Guid.NewGuid(),
            DocumentNumber = "DOC-" + DateTime.UtcNow.Ticks,
            EventId = eventId,
            Status = DocumentStatus.Draft,
            Handler = handler,
            Notes = notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.AllocationDocuments.Add(document);
        await _context.SaveChangesAsync();
        return document;
    }

    public async Task<AllocationDocument?> GetDocumentWithDetailsAsync(Guid documentId)
    {
        return await _context.AllocationDocuments
            .Include(d => d.Event)
            .Include(d => d.Orders).ThenInclude(o => o.TicketType)
            .Include(d => d.Orders).ThenInclude(o => o.Seat)
            .Include(d => d.Disputes)
            .FirstOrDefaultAsync(d => d.Id == documentId);
    }

    public async Task<AllocationDocument> AllocateDocumentAsync(Guid documentId)
    {
        var document = await _context.AllocationDocuments.FindAsync(documentId);
        document.Status = DocumentStatus.Allocated;
        document.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return document;
    }

    public async Task<AllocationDocument> StartReviewAsync(Guid documentId)
    {
        var document = await _context.AllocationDocuments.FindAsync(documentId);
        document.Status = DocumentStatus.Reviewing;
        document.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return document;
    }

    public async Task<AllocationDocument> MarkMissingMaterialAsync(Guid documentId)
    {
        var document = await _context.AllocationDocuments.FindAsync(documentId);
        document.Status = DocumentStatus.MissingMaterial;
        document.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return document;
    }

    public async Task<AllocationDocument> CompleteDocumentAsync(Guid documentId)
    {
        var document = await _context.AllocationDocuments.FindAsync(documentId);
        document.Status = DocumentStatus.Completed;
        document.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return document;
    }

    public async Task<AllocationDocument> CloseDocumentAsync(Guid documentId)
    {
        var document = await _context.AllocationDocuments
            .Include(d => d.Orders)
            .FirstAsync(d => d.Id == documentId);
        document.Status = DocumentStatus.Closed;
        document.ClosedAt = DateTime.UtcNow;
        document.UpdatedAt = DateTime.UtcNow;
        foreach (var order in document.Orders)
        {
            order.Status = DocumentStatus.Closed;
            order.ClosedAt = DateTime.UtcNow;
        }
        await _context.SaveChangesAsync();
        return document;
    }

    public async Task<IReadOnlyList<AllocationDocument>> ListDocumentsAsync(DocumentStatus? statusFilter = null)
    {
        var query = _context.AllocationDocuments.AsQueryable();
        if (statusFilter.HasValue)
        {
            query = query.Where(d => d.Status == statusFilter.Value);
        }
        return await query.OrderByDescending(d => d.CreatedAt).ToListAsync();
    }
}
