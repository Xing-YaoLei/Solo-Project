using Microsoft.EntityFrameworkCore;
using RehabSettlement.Api.Data;
using RehabSettlement.Api.Dtos;
using RehabSettlement.Api.Enums;

namespace RehabSettlement.Api.Services;

public interface IStatisticsService
{
    Task<DashboardDto> GetDashboardAsync(DateOnly? startDate, DateOnly? endDate);
    Task<TrainingCompletionRateDto> GetTrainingCompletionRateAsync(DateOnly? startDate, DateOnly? endDate);
    Task<List<SourceChannelStatisticsDto>> GetSourceChannelStatisticsAsync(DateOnly? startDate, DateOnly? endDate);
    Task<List<AssigneeStatisticsDto>> GetAssigneeStatisticsAsync(DateOnly? startDate, DateOnly? endDate);
    Task<List<ReviewTagStatisticsDto>> GetReviewTagStatisticsAsync(DateOnly? startDate, DateOnly? endDate);
    Task<List<StatusOverviewDto>> GetStatusOverviewAsync(DateOnly? startDate, DateOnly? endDate);
}

public class StatisticsService : IStatisticsService
{
    private readonly AppDbContext _context;

    public StatisticsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardDto> GetDashboardAsync(DateOnly? startDate, DateOnly? endDate)
    {
        var billsQuery = _context.SettlementBills.AsQueryable();

        if (startDate.HasValue)
            billsQuery = billsQuery.Where(b => b.CreatedAt >= startDate.Value.ToDateTime(new TimeOnly(0, 0)));

        if (endDate.HasValue)
            billsQuery = billsQuery.Where(b => b.CreatedAt <= endDate.Value.ToDateTime(new TimeOnly(23, 59, 59)));

        var totalBills = await billsQuery.CountAsync();
        var totalAmount = await billsQuery.SumAsync(b => b.TotalAmount);
        var insuranceAmount = await billsQuery.SumAsync(b => b.InsuranceAmount);

        var pendingBills = await billsQuery.Where(b => 
            b.StatusId == (int)SettlementStatus.PendingReview ||
            b.StatusId == (int)SettlementStatus.Processing ||
            b.StatusId == (int)SettlementStatus.PendingFinalReview).CountAsync();

        var completedBills = await billsQuery.Where(b => 
            b.StatusId == (int)SettlementStatus.Completed ||
            b.StatusId == (int)SettlementStatus.Closed).CountAsync();

        var exceptionBills = await billsQuery.Where(b =>
            b.StatusId == (int)SettlementStatus.InsuranceRejected ||
            b.StatusId == (int)SettlementStatus.SupplementingMaterials ||
            b.StatusId == (int)SettlementStatus.Escalated).CountAsync();

        var statusOverview = await GetStatusOverviewAsync(startDate, endDate);
        var sourceChannelStats = await GetSourceChannelStatisticsAsync(startDate, endDate);
        var trainingCompletionRate = await GetTrainingCompletionRateAsync(startDate, endDate);

        return new DashboardDto
        {
            TotalBills = totalBills,
            PendingBills = pendingBills,
            CompletedBills = completedBills,
            ExceptionBills = exceptionBills,
            TotalAmount = totalAmount,
            InsuranceAmount = insuranceAmount,
            StatusOverview = statusOverview,
            SourceChannelStats = sourceChannelStats,
            TrainingCompletionRate = trainingCompletionRate
        };
    }

    public async Task<TrainingCompletionRateDto> GetTrainingCompletionRateAsync(DateOnly? startDate, DateOnly? endDate)
    {
        var query = _context.TreatmentCalendars.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(t => t.TreatmentDate >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(t => t.TreatmentDate <= endDate.Value);

        var total = await query.CountAsync();
        var completed = await query.Where(t => t.StatusId == (int)TreatmentStatus.Completed).CountAsync();
        var cancelled = await query.Where(t => t.StatusId == (int)TreatmentStatus.Cancelled).CountAsync();
        var noShow = await query.Where(t => t.StatusId == (int)TreatmentStatus.NoShow).CountAsync();

        return new TrainingCompletionRateDto
        {
            TotalScheduled = total,
            Completed = completed,
            Cancelled = cancelled,
            NoShow = noShow,
            CompletionRate = total > 0 ? (decimal)completed / total * 100 : 0
        };
    }

    public async Task<List<SourceChannelStatisticsDto>> GetSourceChannelStatisticsAsync(DateOnly? startDate, DateOnly? endDate)
    {
        var query = _context.SettlementBills
            .Include(b => b.SourceChannel)
            .Where(b => b.SourceChannelId.HasValue);

        if (startDate.HasValue)
            query = query.Where(b => b.CreatedAt >= startDate.Value.ToDateTime(new TimeOnly(0, 0)));

        if (endDate.HasValue)
            query = query.Where(b => b.CreatedAt <= endDate.Value.ToDateTime(new TimeOnly(23, 59, 59)));

        var totalBills = await _context.SettlementBills.CountAsync();

        var result = await query
            .GroupBy(b => new { b.SourceChannelId, b.SourceChannel!.Name })
            .Select(g => new SourceChannelStatisticsDto
            {
                SourceChannelId = g.Key.SourceChannelId.Value,
                SourceChannelName = g.Key.Name,
                BillCount = g.Count(),
                TotalAmount = g.Sum(b => b.TotalAmount),
                InsuranceAmount = g.Sum(b => b.InsuranceAmount),
                Rate = totalBills > 0 ? (decimal)g.Count() / totalBills * 100 : 0
            })
            .OrderByDescending(s => s.BillCount)
            .ToListAsync();

        return result;
    }

    public async Task<List<AssigneeStatisticsDto>> GetAssigneeStatisticsAsync(DateOnly? startDate, DateOnly? endDate)
    {
        var query = _context.SettlementBills
            .Include(b => b.Assignee)
            .Where(b => b.AssigneeId.HasValue);

        if (startDate.HasValue)
            query = query.Where(b => b.CreatedAt >= startDate.Value.ToDateTime(new TimeOnly(0, 0)));

        if (endDate.HasValue)
            query = query.Where(b => b.CreatedAt <= endDate.Value.ToDateTime(new TimeOnly(23, 59, 59)));

        var result = await query
            .GroupBy(b => new { b.AssigneeId, b.Assignee!.RealName })
            .Select(g => new AssigneeStatisticsDto
            {
                AssigneeId = g.Key.AssigneeId.Value,
                AssigneeName = g.Key.RealName,
                BillCount = g.Count(),
                CompletedCount = g.Count(b => b.StatusId == (int)SettlementStatus.Completed || b.StatusId == (int)SettlementStatus.Closed),
                PendingCount = g.Count(b => 
                    b.StatusId == (int)SettlementStatus.PendingReview ||
                    b.StatusId == (int)SettlementStatus.Processing ||
                    b.StatusId == (int)SettlementStatus.PendingFinalReview),
                RejectedCount = g.Count(b => 
                    b.StatusId == (int)SettlementStatus.InsuranceRejected ||
                    b.StatusId == (int)SettlementStatus.ReviewRejected ||
                    b.StatusId == (int)SettlementStatus.SupplementingMaterials ||
                    b.StatusId == (int)SettlementStatus.Escalated),
                CompletedRate = g.Count() > 0 
                    ? (decimal)g.Count(b => b.StatusId == (int)SettlementStatus.Completed || b.StatusId == (int)SettlementStatus.Closed) / g.Count() * 100 
                    : 0
            })
            .OrderByDescending(s => s.BillCount)
            .ToListAsync();

        return result;
    }

    public async Task<List<ReviewTagStatisticsDto>> GetReviewTagStatisticsAsync(DateOnly? startDate, DateOnly? endDate)
    {
        var query = _context.BillReviewTags
            .Include(bt => bt.ReviewTag)
            .Include(bt => bt.Bill)
            .AsQueryable();

        if (startDate.HasValue)
            query = query.Where(bt => bt.Bill!.CreatedAt >= startDate.Value.ToDateTime(new TimeOnly(0, 0)));

        if (endDate.HasValue)
            query = query.Where(bt => bt.Bill!.CreatedAt <= endDate.Value.ToDateTime(new TimeOnly(23, 59, 59)));

        var result = await query
            .GroupBy(bt => new { bt.ReviewTagId, bt.ReviewTag!.Name, bt.ReviewTag.Color })
            .Select(g => new ReviewTagStatisticsDto
            {
                ReviewTagId = g.Key.ReviewTagId,
                ReviewTagName = g.Key.Name,
                BillCount = g.Count(),
                TotalAmount = g.Sum(bt => bt.Bill!.TotalAmount),
                Color = g.Key.Color
            })
            .OrderByDescending(s => s.BillCount)
            .ToListAsync();

        return result;
    }

    public async Task<List<StatusOverviewDto>> GetStatusOverviewAsync(DateOnly? startDate, DateOnly? endDate)
    {
        var query = _context.SettlementBills.AsQueryable();

        if (startDate.HasValue)
            query = query.Where(b => b.CreatedAt >= startDate.Value.ToDateTime(new TimeOnly(0, 0)));

        if (endDate.HasValue)
            query = query.Where(b => b.CreatedAt <= endDate.Value.ToDateTime(new TimeOnly(23, 59, 59)));

        var statusList = new List<(int Id, string Name)>
        {
            (1, "待录入"),
            (2, "待审核"),
            (3, "审核通过"),
            (4, "审核驳回"),
            (5, "处理中"),
            (6, "待复盘"),
            (7, "已完成"),
            (8, "已关闭"),
            (9, "医保拒付"),
            (10, "补充材料中"),
            (11, "升级处理")
        };

        var result = new List<StatusOverviewDto>();

        foreach (var status in statusList)
        {
            var count = await query.Where(b => b.StatusId == status.Id).CountAsync();
            var amount = await query.Where(b => b.StatusId == status.Id).SumAsync(b => b.TotalAmount);

            result.Add(new StatusOverviewDto
            {
                StatusId = status.Id,
                StatusName = status.Name,
                Count = count,
                Amount = amount
            });
        }

        return result;
    }
}
