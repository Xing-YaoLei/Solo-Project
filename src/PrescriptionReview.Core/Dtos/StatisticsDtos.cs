namespace PrescriptionReview.Core.Dtos;

public class StatisticsDto
{
    public int TotalPrescriptions { get; set; }
    public int PendingCount { get; set; }
    public int ReviewingCount { get; set; }
    public int ApprovedCount { get; set; }
    public int RejectedCount { get; set; }
    public int UnclearCount { get; set; }
    public int SupplementRequiredCount { get; set; }
    public int CompletedCount { get; set; }
    public int FollowUpCompletedCount { get; set; }
    public decimal TotalAmount { get; set; }
}

public class PrescriptionStatisticsDto
{
    public DateTime Date { get; set; }
    public int TotalCount { get; set; }
    public int ApprovedCount { get; set; }
    public int RejectedCount { get; set; }
    public int UnclearCount { get; set; }
}

public class StoreStatisticsDto
{
    public int StoreId { get; set; }
    public string StoreName { get; set; } = string.Empty;
    public int TotalCount { get; set; }
    public int ApprovedCount { get; set; }
    public decimal ApprovalRate { get; set; }
    public int FollowUpCompletedCount { get; set; }
}

public class StatisticsQueryDto
{
    public int? StoreId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? GroupBy { get; set; }
}
