using PrescriptionReview.Infrastructure.Data;
using PrescriptionReview.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace PrescriptionReview.Infrastructure.Services;

public class HangfireJobs
{
    private readonly AppDbContext _context;

    public HangfireJobs(AppDbContext context)
    {
        _context = context;
    }

    public async Task ProcessExpiredPrescriptions()
    {
        var expiredDate = DateTime.Now.AddDays(-7);
        var prescriptions = await _context.Prescriptions
            .Where(p => p.Status == PrescriptionStatus.Pending && p.CreatedAt < expiredDate)
            .ToListAsync();

        foreach (var prescription in prescriptions)
        {
            prescription.Status = PrescriptionStatus.Unclear;
            prescription.UpdatedAt = DateTime.Now;

            _context.AuditLogs.Add(new Domain.Entities.AuditLog
            {
                PrescriptionId = prescription.Id,
                OperatorId = 1,
                OldStatus = PrescriptionStatus.Pending,
                NewStatus = PrescriptionStatus.Unclear,
                Action = "系统自动标记",
                Remark = "处方超过7天未提交，自动标记为处方不清",
                CreatedAt = DateTime.Now
            });
        }

        await _context.SaveChangesAsync();
    }

    public async Task DailyStatisticsSummary()
    {
        var yesterday = DateTime.Today.AddDays(-1);
        var today = DateTime.Today;

        var totalCount = await _context.Prescriptions
            .CountAsync(p => p.CreatedAt >= yesterday && p.CreatedAt < today);

        var approvedCount = await _context.Prescriptions
            .CountAsync(p => p.ReviewedAt >= yesterday && p.ReviewedAt < today && p.Status == PrescriptionStatus.Approved);

        Console.WriteLine($"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] 每日统计：昨日新增处方 {totalCount} 条，审核通过 {approvedCount} 条");
    }

    public async Task FollowUpReminder()
    {
        var threeDaysAgo = DateTime.Now.AddDays(-3);
        var prescriptions = await _context.Prescriptions
            .Include(p => p.FollowUp)
            .Where(p => p.Status == PrescriptionStatus.Approved
                && p.ReviewedAt < threeDaysAgo
                && (p.FollowUp == null || !p.FollowUp.IsCompleted))
            .Take(50)
            .ToListAsync();

        foreach (var prescription in prescriptions)
        {
            Console.WriteLine($"提醒：处方 {prescription.PrescriptionNo} 需要回访");
        }

        await Task.CompletedTask;
    }
}
