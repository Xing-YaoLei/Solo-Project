using Microsoft.EntityFrameworkCore;
using PrescriptionReview.Core.Common;
using PrescriptionReview.Core.Dtos;
using PrescriptionReview.Core.Interfaces;
using PrescriptionReview.Domain.Enums;
using PrescriptionReview.Infrastructure.Data;

namespace PrescriptionReview.Infrastructure.Services;

public class StatisticsService : IStatisticsService
{
    private readonly AppDbContext _context;

    public StatisticsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResult<StatisticsDto>> GetOverviewAsync(StatisticsQueryDto query)
    {
        var queryable = _context.Prescriptions.AsQueryable();

        if (query.StoreId.HasValue)
        {
            queryable = queryable.Where(p => p.StoreId == query.StoreId.Value);
        }

        if (query.StartDate.HasValue)
        {
            queryable = queryable.Where(p => p.CreatedAt >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            queryable = queryable.Where(p => p.CreatedAt <= query.EndDate.Value);
        }

        var totalPrescriptions = await queryable.CountAsync();
        var pendingCount = await queryable.CountAsync(p => p.Status == PrescriptionStatus.Pending);
        var reviewingCount = await queryable.CountAsync(p => p.Status == PrescriptionStatus.Reviewing);
        var approvedCount = await queryable.CountAsync(p => p.Status == PrescriptionStatus.Approved);
        var rejectedCount = await queryable.CountAsync(p => p.Status == PrescriptionStatus.Rejected);
        var unclearCount = await queryable.CountAsync(p => p.Status == PrescriptionStatus.Unclear);
        var supplementRequiredCount = await queryable.CountAsync(p => p.Status == PrescriptionStatus.SupplementRequired);
        var completedCount = await queryable.CountAsync(p => p.Status == PrescriptionStatus.Completed);

        var followUpCompletedCount = await _context.FollowUps
            .Where(f => f.IsCompleted && queryable.Any(p => p.Id == f.PrescriptionId))
            .CountAsync();

        var totalAmount = await queryable
            .SelectMany(p => p.Items)
            .SumAsync(i => (decimal?)i.Price * i.Quantity) ?? 0;

        var result = new StatisticsDto
        {
            TotalPrescriptions = totalPrescriptions,
            PendingCount = pendingCount,
            ReviewingCount = reviewingCount,
            ApprovedCount = approvedCount,
            RejectedCount = rejectedCount,
            UnclearCount = unclearCount,
            SupplementRequiredCount = supplementRequiredCount,
            CompletedCount = completedCount,
            FollowUpCompletedCount = followUpCompletedCount,
            TotalAmount = totalAmount
        };

        return ApiResult<StatisticsDto>.Ok(result);
    }

    public async Task<ApiResult<List<PrescriptionStatisticsDto>>> GetPrescriptionTrendAsync(StatisticsQueryDto query)
    {
        var startDate = query.StartDate ?? DateTime.Now.AddDays(-30);
        var endDate = query.EndDate ?? DateTime.Now;

        var queryable = _context.Prescriptions
            .Where(p => p.CreatedAt >= startDate && p.CreatedAt <= endDate);

        if (query.StoreId.HasValue)
        {
            queryable = queryable.Where(p => p.StoreId == query.StoreId.Value);
        }

        var data = await queryable
            .GroupBy(p => p.CreatedAt.Date)
            .Select(g => new
            {
                Date = g.Key,
                TotalCount = g.Count(),
                ApprovedCount = g.Count(p => p.Status == PrescriptionStatus.Approved),
                RejectedCount = g.Count(p => p.Status == PrescriptionStatus.Rejected),
                UnclearCount = g.Count(p => p.Status == PrescriptionStatus.Unclear || p.AuditLogs.Any(a => a.NewStatus == PrescriptionStatus.Unclear))
            })
            .OrderBy(r => r.Date)
            .ToListAsync();

        var result = data.Select(d => new PrescriptionStatisticsDto
        {
            Date = d.Date,
            TotalCount = d.TotalCount,
            ApprovedCount = d.ApprovedCount,
            RejectedCount = d.RejectedCount,
            UnclearCount = d.UnclearCount
        }).ToList();

        return ApiResult<List<PrescriptionStatisticsDto>>.Ok(result);
    }

    public async Task<ApiResult<List<StoreStatisticsDto>>> GetStoreStatisticsAsync(StatisticsQueryDto query)
    {
        var queryable = _context.Prescriptions.AsQueryable();

        if (query.StartDate.HasValue)
        {
            queryable = queryable.Where(p => p.CreatedAt >= query.StartDate.Value);
        }

        if (query.EndDate.HasValue)
        {
            queryable = queryable.Where(p => p.CreatedAt <= query.EndDate.Value);
        }

        var data = await queryable
            .GroupBy(p => p.StoreId)
            .Select(g => new
            {
                StoreId = g.Key,
                TotalCount = g.Count(),
                ApprovedCount = g.Count(p => p.Status == PrescriptionStatus.Approved),
                FollowUpCompletedCount = g.Count(p => p.FollowUp != null && p.FollowUp.IsCompleted)
            })
            .ToListAsync();

        var stores = await _context.Stores.ToDictionaryAsync(s => s.Id, s => s.Name);

        var result = data.Select(d => new StoreStatisticsDto
        {
            StoreId = d.StoreId,
            StoreName = stores.ContainsKey(d.StoreId) ? stores[d.StoreId] : "未知门店",
            TotalCount = d.TotalCount,
            ApprovedCount = d.ApprovedCount,
            ApprovalRate = d.TotalCount > 0 ? (decimal)d.ApprovedCount / d.TotalCount * 100 : 0,
            FollowUpCompletedCount = d.FollowUpCompletedCount
        }).OrderByDescending(s => s.TotalCount).ToList();

        return ApiResult<List<StoreStatisticsDto>>.Ok(result);
    }
}
