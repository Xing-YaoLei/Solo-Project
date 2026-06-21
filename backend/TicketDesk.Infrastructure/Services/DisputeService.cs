using Microsoft.EntityFrameworkCore;
using TicketDesk.Domain.Entities;
using TicketDesk.Domain.Enums;
using TicketDesk.Infrastructure.Data;

namespace TicketDesk.Infrastructure.Services;

public class DisputeService
{
    private readonly TicketDeskDbContext _context;

    public DisputeService(TicketDeskDbContext context)
    {
        _context = context;
    }

    public async Task<Dispute> CreateDisputeAsync(Guid orderId, DisputeReason reason, string description, string handler, string evidenceJson, Guid allocationDocumentId)
    {
        var dispute = new Dispute
        {
            Id = Guid.NewGuid(),
            OrderId = orderId,
            Reason = reason,
            Status = DisputeStatus.Pending,
            Description = description,
            Handler = handler,
            EvidenceJson = evidenceJson,
            CreatedAt = DateTime.UtcNow
        };
        _context.Disputes.Add(dispute);
        _context.Entry(dispute).Property("AllocationDocumentId").CurrentValue = allocationDocumentId;
        await _context.SaveChangesAsync();
        return dispute;
    }

    public async Task<Dispute?> GetDisputeWithOrderAsync(Guid disputeId)
    {
        return await _context.Disputes
            .Include(d => d.Order)
            .FirstOrDefaultAsync(d => d.Id == disputeId);
    }

    public async Task<Dispute> UpdateDisputeStatusAsync(Guid disputeId, DisputeStatus status, string? resolution = null)
    {
        var dispute = await _context.Disputes.FindAsync(disputeId);
        dispute.Status = status;
        if (status == DisputeStatus.Resolved)
        {
            dispute.ResolvedAt = DateTime.UtcNow;
            dispute.Resolution = resolution;
        }
        await _context.SaveChangesAsync();
        return dispute;
    }

    public async Task<Dispute> MarkMissingEvidenceAsync(Guid disputeId)
    {
        var dispute = await _context.Disputes.FindAsync(disputeId);
        dispute.Status = DisputeStatus.MissingEvidence;
        await _context.SaveChangesAsync();
        return dispute;
    }

    public async Task<Dispute> EscalateDisputeAsync(Guid disputeId)
    {
        var dispute = await _context.Disputes.FindAsync(disputeId);
        dispute.Status = DisputeStatus.Escalated;
        await _context.SaveChangesAsync();
        return dispute;
    }

    public async Task<IReadOnlyList<Dispute>> GetDisputesByDocumentAsync(Guid allocationDocumentId)
    {
        return await _context.Disputes
            .Where(d => EF.Property<Guid>(d, "AllocationDocumentId") == allocationDocumentId)
            .ToListAsync();
    }
}
