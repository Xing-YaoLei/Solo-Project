using ComplianceAudit.Core.Entities;
using ComplianceAudit.Core.Enums;

namespace ComplianceAudit.Core.Interfaces;

public interface IStatisticsService
{
    Task<DashboardStats> GetDashboardStatsAsync(long? userId, AuditRole role);
    Task<IEnumerable<ScheduleStatusSummary>> GetScheduleStatusSummaryAsync(DateTime? startDate, DateTime? endDate);
    Task<IEnumerable<RiskDistribution>> GetRiskDistributionAsync();
    Task<IEnumerable<ComplianceRateSummary>> GetComplianceRateByCategoryAsync(DateTime? startDate, DateTime? endDate);
    Task<SamplingCoverageReport> GetSamplingCoverageReportAsync(long scheduleId);
    Task<IEnumerable<DocumentTraceInfo>> GetDocumentTraceAsync(string documentNo);
    Task<IEnumerable<AuditorPerformance>> GetAuditorPerformanceAsync(DateTime? startDate, DateTime? endDate);
    Task<IEnumerable<RectificationSummary>> GetRectificationSummaryAsync(DateTime? startDate, DateTime? endDate);
    Task<EvidenceCompletionReport> GetEvidenceCompletionReportAsync();
}

public class DashboardStats
{
    public int TotalSchedules { get; set; }
    public int MyPendingSchedules { get; set; }
    public int MyInProgressSchedules { get; set; }
    public int PendingReviewCount { get; set; }
    public int OpenCheckRecords { get; set; }
    public int EvidenceMissingCount { get; set; }
    public int OverdueRectifications { get; set; }
    public decimal OverallComplianceRate { get; set; }
    public int HighRiskFindings { get; set; }
    public int CriticalRiskFindings { get; set; }
}

public class ScheduleStatusSummary
{
    public CheckStatus Status { get; set; }
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class RiskDistribution
{
    public RiskLevel RiskLevel { get; set; }
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class ComplianceRateSummary
{
    public string Category { get; set; } = string.Empty;
    public int TotalChecks { get; set; }
    public int CompliantCount { get; set; }
    public decimal ComplianceRate { get; set; }
}

public class SamplingCoverageReport
{
    public long ScheduleId { get; set; }
    public string ScheduleTitle { get; set; } = string.Empty;
    public int TotalDocuments { get; set; }
    public int SampledCount { get; set; }
    public decimal CoverageRate { get; set; }
    public IEnumerable<SamplingCoverageDetail> Details { get; set; } = new List<SamplingCoverageDetail>();
}

public class SamplingCoverageDetail
{
    public string DocumentType { get; set; } = string.Empty;
    public int TotalDocuments { get; set; }
    public int SampledCount { get; set; }
    public decimal CoverageRate { get; set; }
    public IEnumerable<string> SampledDocumentNos { get; set; } = new List<string>();
}

public class DocumentTraceInfo
{
    public long EntityId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime ActionTime { get; set; }
    public string Operator { get; set; } = string.Empty;
    public string? Remarks { get; set; }
    public string? SourceReference { get; set; }
}

public class AuditorPerformance
{
    public long AuditorId { get; set; }
    public string AuditorName { get; set; } = string.Empty;
    public int CompletedSchedules { get; set; }
    public int TotalCheckRecords { get; set; }
    public int NonCompliantCount { get; set; }
    public decimal DetectionRate { get; set; }
    public decimal AverageCompletionDays { get; set; }
}

public class RectificationSummary
{
    public RectificationStatus Status { get; set; }
    public int Count { get; set; }
    public int OverdueCount { get; set; }
    public decimal AverageCompletionDays { get; set; }
}

public class EvidenceCompletionReport
{
    public int TotalCheckRecords { get; set; }
    public int CompleteEvidenceCount { get; set; }
    public int MissingEvidenceCount { get; set; }
    public int SupplementRequestedCount { get; set; }
    public decimal EvidenceCompletionRate { get; set; }
}
