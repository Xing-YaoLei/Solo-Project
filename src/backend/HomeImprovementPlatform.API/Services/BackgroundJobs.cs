using HomeImprovementPlatform.API.Data;
using HomeImprovementPlatform.API.Enums;
using Microsoft.EntityFrameworkCore;

namespace HomeImprovementPlatform.API.Services;

public interface IBackgroundJobs
{
    Task CheckAmountConsistencyAsync();
    Task SendApprovalRemindersAsync();
    Task UpdatePaymentStatusAsync();
}

public class BackgroundJobs : IBackgroundJobs
{
    private readonly ApplicationDbContext _context;
    private readonly IDocumentService _documentService;

    public BackgroundJobs(ApplicationDbContext context, IDocumentService documentService)
    {
        _context = context;
        _documentService = documentService;
    }

    public async Task CheckAmountConsistencyAsync()
    {
        var documents = await _context.Documents
            .Include(d => d.Items)
            .Where(d => d.AmountConsistency == AmountConsistencyStatus.PendingVerification)
            .ToListAsync();

        foreach (var doc in documents)
        {
            var calculatedTotal = doc.Items.Sum(i => i.Subtotal);
            var isConsistent = Math.Abs(calculatedTotal - doc.ExpectedAmount) < 0.01m;
            
            doc.AmountConsistency = isConsistent ? AmountConsistencyStatus.Consistent : AmountConsistencyStatus.Inconsistent;
        }

        await _context.SaveChangesAsync();
    }

    public async Task SendApprovalRemindersAsync()
    {
        var pendingApprovals = await _context.ApprovalNodes
            .Include(a => a.Document)
            .Include(a => a.Approver)
            .Where(a => !a.IsApproved && a.CreatedAt < DateTime.UtcNow.AddHours(-24))
            .ToListAsync();

        foreach (var approval in pendingApprovals)
        {
            Console.WriteLine($"Reminder: Approval pending for document {approval.Document?.DocumentNumber} for user {approval.Approver?.FullName}");
        }

        await Task.CompletedTask;
    }

    public async Task UpdatePaymentStatusAsync()
    {
        var overduePayments = await _context.PaymentRecords
            .Where(p => p.Status == PaymentStatus.Pending && p.PaymentDate < DateTime.UtcNow.AddDays(-7))
            .ToListAsync();

        foreach (var payment in overduePayments)
        {
            payment.Status = PaymentStatus.Overdue;
        }

        await _context.SaveChangesAsync();
    }
}
