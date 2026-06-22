using Microsoft.EntityFrameworkCore;
using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;
using ComplianceAudit.Core.Interfaces;
using ComplianceAudit.Infrastructure.Data;

namespace ComplianceAudit.Infrastructure.Services;

public class StatisticsService : IStatisticsService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _unitOfWork;

    public StatisticsService(ApplicationDbContext context, IUnitOfWork unitOfWork)
    {
        _context = context;
        _unitOfWork = unitOfWork;
    }

    public async Task<DashboardStats> GetDashboardStatsAsync(long? userId, AuditRole role)
    {
        var allSchedules = await _context.AuditSchedules.Where(s => !s.IsDeleted).ToListAsync();
        var allCheckRecords = await _context.CheckRecords.Where(cr => !cr.IsDeleted).ToListAsync();
        var allEvidenceMissing = await _context.EvidenceMissingRecords
            .Where(emr => !emr.IsDeleted && emr.Status != EvidenceStatus.Complete && emr.Status != EvidenceStatus.Waived)
            .ToListAsync();
        var allRectifications = await _context.Rectifications.Where(r => !r.IsDeleted).ToListAsync();

        var mySchedules = role switch
        {
            AuditRole.Auditor => allSchedules.Where(s => userId.HasValue && s.AuditorId == userId.Value),
            AuditRole.BusinessOwner => allSchedules.Where(s => userId.HasValue && s.BusinessOwnerId == userId.Value),
            _ => allSchedules
        };

        var pendingReviewCount = allSchedules.Count(s => s.Status == CheckStatus.Submitted)
            + allCheckRecords.Count(cr => cr.Status == CheckStatus.Submitted)
            + allRectifications.Count(r => r.Status == RectificationStatus.SubmittedForReview);

        var completedCheckRecords = allCheckRecords.Where(cr => cr.IsCompliant.HasValue).ToList();
        var complianceRate = completedCheckRecords.Any()
            ? (decimal)completedCheckRecords.Count(cr => cr.IsCompliant == true) / completedCheckRecords.Count * 100
            : 0;

        return new DashboardStats
        {
            TotalSchedules = allSchedules.Count,
            MyPendingSchedules = mySchedules.Count(s => s.Status == CheckStatus.Pending || s.Status == CheckStatus.InProgress),
            MyInProgressSchedules = mySchedules.Count(s => s.Status == CheckStatus.InProgress),
            PendingReviewCount = pendingReviewCount,
            OpenCheckRecords = allCheckRecords.Count(cr => cr.Status != CheckStatus.Closed && cr.Status != CheckStatus.Approved),
            EvidenceMissingCount = allEvidenceMissing.Count,
            OverdueRectifications = allRectifications.Count(r => r.Status == RectificationStatus.Overdue),
            OverallComplianceRate = Math.Round(complianceRate, 2),
            HighRiskFindings = allCheckRecords.Count(cr => cr.RiskLevel == RiskLevel.High && cr.IsCompliant == false),
            CriticalRiskFindings = allCheckRecords.Count(cr => cr.RiskLevel == RiskLevel.Critical && cr.IsCompliant == false)
        };
    }

    public async Task<IEnumerable<ScheduleStatusSummary>> GetScheduleStatusSummaryAsync(DateTime? startDate, DateTime? endDate)
    {
        var schedules = await _context.AuditSchedules
            .Where(s => !s.IsDeleted
                && (!startDate.HasValue || s.CreatedAt >= startDate.Value)
                && (!endDate.HasValue || s.CreatedAt <= endDate.Value))
            .ToListAsync();

        var total = schedules.Count;
        var statusGroups = schedules.GroupBy(s => s.Status);

        return statusGroups.Select(g => new ScheduleStatusSummary
        {
            Status = g.Key,
            Count = g.Count(),
            Percentage = total > 0 ? Math.Round((decimal)g.Count() / total * 100, 2) : 0
        });
    }

    public async Task<IEnumerable<RiskDistribution>> GetRiskDistributionAsync()
    {
        var checkRecords = await _context.CheckRecords
            .Where(cr => !cr.IsDeleted && cr.IsCompliant.HasValue)
            .ToListAsync();

        var total = checkRecords.Count;
        var riskGroups = checkRecords.GroupBy(cr => cr.RiskLevel);

        return riskGroups.Select(g => new RiskDistribution
        {
            RiskLevel = g.Key,
            Count = g.Count(),
            Percentage = total > 0 ? Math.Round((decimal)g.Count() / total * 100, 2) : 0
        });
    }

    public async Task<IEnumerable<ComplianceRateSummary>> GetComplianceRateByCategoryAsync(DateTime? startDate, DateTime? endDate)
    {
        var checkRecords = await _context.CheckRecords
            .Include(cr => cr.Schedule)
            .ThenInclude(s => s.Regulation)
            .Where(cr => !cr.IsDeleted
                && cr.IsCompliant.HasValue
                && (!startDate.HasValue || cr.CreatedAt >= startDate.Value)
                && (!endDate.HasValue || cr.CreatedAt <= endDate.Value))
            .ToListAsync();

        var categoryGroups = checkRecords
            .GroupBy(cr => cr.Schedule?.Regulation?.Category ?? "未分类");

        return categoryGroups.Select(g => new ComplianceRateSummary
        {
            Category = g.Key,
            TotalChecks = g.Count(),
            CompliantCount = g.Count(cr => cr.IsCompliant == true),
            ComplianceRate = g.Any() ? Math.Round((decimal)g.Count(cr => cr.IsCompliant == true) / g.Count() * 100, 2) : 0
        });
    }

    public async Task<SamplingCoverageReport> GetSamplingCoverageReportAsync(long scheduleId)
    {
        var schedule = await _context.AuditSchedules
            .Include(s => s.Regulation)
            .FirstOrDefaultAsync(s => s.Id == scheduleId && !s.IsDeleted)
            ?? throw new KeyNotFoundException($"Schedule {scheduleId} not found");

        var samplingRecords = await _context.SamplingRecords
            .Where(sr => sr.ScheduleId == scheduleId && !sr.IsDeleted)
            .ToListAsync();

        var estimatedTotal = samplingRecords.Any() ? (int)(samplingRecords.Count / 0.1) : 0;

        var typeGroups = samplingRecords.GroupBy(sr => sr.DocumentType);

        var details = typeGroups.Select(g =>
        {
            var typeTotal = g.Count() * 10;
            return new SamplingCoverageDetail
            {
                DocumentType = g.Key,
                TotalDocuments = typeTotal,
                SampledCount = g.Count(),
                CoverageRate = Math.Round((decimal)g.Count() / typeTotal * 100, 2),
                SampledDocumentNos = g.Select(x => x.DocumentNo).Take(100).ToList()
            };
        }).ToList();

        return new SamplingCoverageReport
        {
            ScheduleId = scheduleId,
            ScheduleTitle = schedule.Title,
            TotalDocuments = estimatedTotal,
            SampledCount = samplingRecords.Count,
            CoverageRate = estimatedTotal > 0 ? Math.Round((decimal)samplingRecords.Count / estimatedTotal * 100, 2) : 100,
            Details = details
        };
    }

    public async Task<IEnumerable<DocumentTraceInfo>> GetDocumentTraceAsync(string documentNo)
    {
        var traceList = new List<DocumentTraceInfo>();

        var samplingRecords = await _context.SamplingRecords
            .Include(sr => sr.CheckRecords)
            .Where(sr => sr.DocumentNo == documentNo && !sr.IsDeleted)
            .ToListAsync();

        foreach (var sr in samplingRecords)
        {
            traceList.Add(new DocumentTraceInfo
            {
                EntityId = sr.Id,
                EntityType = nameof(SamplingRecord),
                Title = $"抽样记录: {sr.DocumentNo}",
                Status = sr.Status.ToString(),
                ActionTime = sr.CreatedAt,
                Operator = "系统",
                SourceReference = sr.ScheduleId.HasValue ? $"Schedule/{sr.ScheduleId}" : null
            });

            foreach (var cr in sr.CheckRecords)
            {
                traceList.Add(new DocumentTraceInfo
                {
                    EntityId = cr.Id,
                    EntityType = nameof(CheckRecord),
                    Title = $"检查记录: {cr.Findings?.Substring(0, Math.Min(50, cr.Findings.Length)) ?? ""}",
                    Status = $"{cr.Status} (合规:{(cr.IsCompliant.HasValue ? cr.IsCompliant.Value ? "是" : "否" : "待判定")})",
                    ActionTime = cr.CheckedAt ?? cr.CreatedAt,
                    Operator = cr.CheckedBy.HasValue ? cr.CheckedBy.Value.ToString() : "系统",
                    Remarks = cr.AuditNotes,
                    SourceReference = $"SamplingRecord/{sr.Id}"
                });

                var histories = await _context.ProcessingHistories
                    .Where(ph => ph.EntityType == nameof(CheckRecord) && ph.EntityId == cr.Id)
                    .OrderBy(ph => ph.OperatedAt)
                    .ToListAsync();

                traceList.AddRange(histories.Select(h => new DocumentTraceInfo
                {
                    EntityId = h.Id,
                    EntityType = nameof(ProcessingHistory),
                    Title = h.ActionType,
                    Status = h.ToStatus?.ToString() ?? "-",
                    ActionTime = h.OperatedAt,
                    Operator = h.OperatorId.ToString(),
                    Remarks = h.Description,
                    SourceReference = $"{nameof(CheckRecord)}/{cr.Id}"
                }));
            }
        }

        return traceList.OrderByDescending(t => t.ActionTime);
    }

    public async Task<IEnumerable<AuditorPerformance>> GetAuditorPerformanceAsync(DateTime? startDate, DateTime? endDate)
    {
        var schedules = await _context.AuditSchedules
            .Include(s => s.Auditor)
            .Include(s => s.CheckRecords)
            .Where(s => !s.IsDeleted
                && (!startDate.HasValue || s.CreatedAt >= startDate.Value)
                && (!endDate.HasValue || s.CreatedAt <= endDate.Value))
            .ToListAsync();

        var auditorGroups = schedules
            .Where(s => s.Auditor != null)
            .GroupBy(s => new { s.AuditorId, s.Auditor!.FullName });

        return auditorGroups.Select(g =>
        {
            var completed = g.Count(s => s.Status == CheckStatus.Approved || s.Status == CheckStatus.Closed);
            var totalChecks = g.Sum(s => s.CheckRecords.Count);
            var nonCompliant = g.Sum(s => s.CheckRecords.Count(cr => cr.IsCompliant == false));
            var completionDays = g.Where(s => s.EndDate != default && s.StartDate != default)
                .Select(s => (s.EndDate - s.StartDate).TotalDays)
                .DefaultIfEmpty(0)
                .Average();

            return new AuditorPerformance
            {
                AuditorId = g.Key.AuditorId,
                AuditorName = g.Key.FullName,
                CompletedSchedules = completed,
                TotalCheckRecords = totalChecks,
                NonCompliantCount = nonCompliant,
                DetectionRate = totalChecks > 0 ? Math.Round((decimal)nonCompliant / totalChecks * 100, 2) : 0,
                AverageCompletionDays = Math.Round((decimal)completionDays, 2)
            };
        });
    }

    public async Task<IEnumerable<RectificationSummary>> GetRectificationSummaryAsync(DateTime? startDate, DateTime? endDate)
    {
        var rectifications = await _context.Rectifications
            .Where(r => !r.IsDeleted
                && (!startDate.HasValue || r.CreatedAt >= startDate.Value)
                && (!endDate.HasValue || r.CreatedAt <= endDate.Value))
            .ToListAsync();

        var statusGroups = rectifications.GroupBy(r => r.Status);

        return statusGroups.Select(g =>
        {
            var completedItems = g.Where(r => r.CompletedAt.HasValue).ToList();
            var avgDays = completedItems.Any()
                ? completedItems.Average(r => (r.CompletedAt!.Value - r.CreatedAt).TotalDays)
                : 0;

            return new RectificationSummary
            {
                Status = g.Key,
                Count = g.Count(),
                OverdueCount = g.Count(r => r.Status == RectificationStatus.Overdue),
                AverageCompletionDays = Math.Round((decimal)avgDays, 2)
            };
        });
    }

    public async Task<EvidenceCompletionReport> GetEvidenceCompletionReportAsync()
    {
        var checkRecords = await _context.CheckRecords
            .Where(cr => !cr.IsDeleted)
            .ToListAsync();

        var total = checkRecords.Count;
        var complete = checkRecords.Count(cr => cr.EvidenceStatus == EvidenceStatus.Complete || cr.EvidenceStatus == EvidenceStatus.Waived);
        var missing = checkRecords.Count(cr => cr.EvidenceStatus == EvidenceStatus.Missing);
        var supplementRequested = checkRecords.Count(cr => cr.EvidenceStatus == EvidenceStatus.SupplementRequested
            || cr.EvidenceStatus == EvidenceStatus.SupplementProvided);

        return new EvidenceCompletionReport
        {
            TotalCheckRecords = total,
            CompleteEvidenceCount = complete,
            MissingEvidenceCount = missing,
            SupplementRequestedCount = supplementRequested,
            EvidenceCompletionRate = total > 0 ? Math.Round((decimal)complete / total * 100, 2) : 0
        };
    }
}
