using AutoMapper;
using HomeImprovementPlatform.API.DTOs.Statistics;
using HomeImprovementPlatform.API.Enums;
using HomeImprovementPlatform.API.Models;
using Microsoft.EntityFrameworkCore;
using HomeImprovementPlatform.API.Data;

namespace HomeImprovementPlatform.API.Services;

public interface IStatisticsService
{
    Task<StatisticsOverviewDto> GetOverviewAsync();
    Task<IEnumerable<PaymentCycleDto>> GetPaymentCyclesAsync(int months = 12);
    Task<IEnumerable<ProjectPerformanceDto>> GetProjectPerformanceAsync();
    Task<IEnumerable<AmountInconsistencyDto>> GetAmountInconsistenciesAsync();
}

public class StatisticsService : IStatisticsService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public StatisticsService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<StatisticsOverviewDto> GetOverviewAsync()
    {
        var totalProjects = await _context.Projects.CountAsync();
        var activeProjects = await _context.Projects.CountAsync(p => p.Status != DocumentStatus.Completed && p.Status != DocumentStatus.Cancelled);
        var pendingDocuments = await _context.Documents.CountAsync(d => d.Status == DocumentStatus.PendingReview || d.Status == DocumentStatus.PendingApproval);
        var pendingApprovals = await _context.ApprovalNodes.CountAsync(a => !a.IsApproved);
        var inconsistentDocuments = await _context.Documents.CountAsync(d => d.AmountConsistency == AmountConsistencyStatus.Inconsistent);
        
        var totalBudget = await _context.Projects.SumAsync(p => p.TotalBudget);
        var totalPaid = await _context.PaymentRecords.Where(p => p.Status == PaymentStatus.Paid).SumAsync(p => p.Amount);
        var totalReceivable = totalBudget - totalPaid;

        return new StatisticsOverviewDto
        {
            TotalProjects = totalProjects,
            ActiveProjects = activeProjects,
            PendingDocuments = pendingDocuments,
            PendingApprovals = pendingApprovals,
            InconsistentDocuments = inconsistentDocuments,
            TotalBudget = totalBudget,
            TotalPaid = totalPaid,
            TotalReceivable = totalReceivable
        };
    }

    public async Task<IEnumerable<PaymentCycleDto>> GetPaymentCyclesAsync(int months = 12)
    {
        var startDate = DateTime.UtcNow.AddMonths(-months);
        
        var paymentsByMonth = await _context.PaymentRecords
            .Include(p => p.Project)
            .Where(p => p.PaymentDate >= startDate && p.Status == PaymentStatus.Paid)
            .GroupBy(p => new { p.PaymentDate!.Value.Year, p.PaymentDate!.Value.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                ProjectCount = g.Select(p => p.ProjectId).Distinct().Count(),
                ExpectedAmount = g.Sum(p => p.Project != null ? p.Project.TotalBudget : 0) / g.Count(),
                ActualPaid = g.Sum(p => p.Amount),
                AverageDays = (int)g.Average(p => (p.PaymentDate!.Value - p.CreatedAt).TotalDays)
            })
            .OrderByDescending(g => g.Year)
            .ThenByDescending(g => g.Month)
            .ToListAsync();

        return paymentsByMonth.Select(x => new PaymentCycleDto
        {
            Period = $"{x.Year}-{x.Month:00}",
            ProjectCount = x.ProjectCount,
            ExpectedAmount = x.ExpectedAmount,
            ActualPaid = x.ActualPaid,
            AveragePaymentDays = x.AverageDays
        });
    }

    public async Task<IEnumerable<ProjectPerformanceDto>> GetProjectPerformanceAsync()
    {
        var projects = await _context.Projects
            .Include(p => p.Owner)
            .Include(p => p.Documents)
            .Include(p => p.PaymentRecords)
            .Where(p => p.Status != DocumentStatus.Draft)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        var result = new List<ProjectPerformanceDto>();

        foreach (var project in projects)
        {
            var paidPayments = project.PaymentRecords.Where(p => p.Status == PaymentStatus.Paid).ToList();
            var paidAmount = paidPayments.Sum(p => p.Amount);
            
            var firstPayment = paidPayments.OrderBy(p => p.PaymentDate).FirstOrDefault();
            var delayDays = firstPayment != null && firstPayment.PaymentDate.HasValue
                ? (int)(firstPayment.PaymentDate.Value - project.StartDate).TotalDays - 30
                : 0;

            result.Add(new ProjectPerformanceDto
            {
                ProjectId = project.Id,
                ProjectName = project.Name,
                ProjectNumber = project.ProjectNumber,
                OwnerName = project.Owner?.FullName ?? string.Empty,
                TotalBudget = project.TotalBudget,
                PaidAmount = paidAmount,
                RemainingAmount = project.TotalBudget - paidAmount,
                PaymentCount = paidPayments.Count,
                PaymentDelayDays = delayDays > 0 ? delayDays : 0,
                Documents = _mapper.Map<List<DocumentSummaryDto>>(project.Documents.OrderByDescending(d => d.CreatedAt))
            });
        }

        return result;
    }

    public async Task<IEnumerable<AmountInconsistencyDto>> GetAmountInconsistenciesAsync()
    {
        var documents = await _context.Documents
            .Include(d => d.Project)
            .Include(d => d.CreatedBy)
            .Where(d => d.AmountConsistency == AmountConsistencyStatus.Inconsistent)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        return _mapper.Map<IEnumerable<AmountInconsistencyDto>>(documents);
    }
}
