using HomeImprovementPlatform.API.Enums;

namespace HomeImprovementPlatform.API.DTOs.Statistics;

public class StatisticsOverviewDto
{
    public int TotalProjects { get; set; }
    public int ActiveProjects { get; set; }
    public int PendingDocuments { get; set; }
    public int PendingApprovals { get; set; }
    public int InconsistentDocuments { get; set; }
    public decimal TotalBudget { get; set; }
    public decimal TotalPaid { get; set; }
    public decimal TotalReceivable { get; set; }
}

public class PaymentCycleDto
{
    public string Period { get; set; } = string.Empty;
    public int ProjectCount { get; set; }
    public decimal ExpectedAmount { get; set; }
    public decimal ActualPaid { get; set; }
    public int AveragePaymentDays { get; set; }
}

public class ProjectPerformanceDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectNumber { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
    public decimal TotalBudget { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
    public int PaymentCount { get; set; }
    public int PaymentDelayDays { get; set; }
    public List<DocumentSummaryDto> Documents { get; set; } = new();
}

public class DocumentSummaryDto
{
    public Guid DocumentId { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DocumentType Type { get; set; }
    public decimal ExpectedAmount { get; set; }
    public decimal? ActualAmount { get; set; }
    public DocumentStatus Status { get; set; }
    public AmountConsistencyStatus AmountConsistency { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AmountInconsistencyDto
{
    public Guid DocumentId { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string ProjectName { get; set; } = string.Empty;
    public decimal ExpectedAmount { get; set; }
    public decimal? ActualAmount { get; set; }
    public decimal Difference { get; set; }
    public string DifferencePercentage { get; set; } = string.Empty;
    public AmountConsistencyStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
}
