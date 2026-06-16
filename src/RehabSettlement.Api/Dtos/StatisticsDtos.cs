namespace RehabSettlement.Api.Dtos;

public class StatisticsDto
{
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class TrainingCompletionRateDto
{
    public int TotalScheduled { get; set; }
    public int Completed { get; set; }
    public int Cancelled { get; set; }
    public int NoShow { get; set; }
    public decimal CompletionRate { get; set; }
}

public class SourceChannelStatisticsDto
{
    public int SourceChannelId { get; set; }
    public string SourceChannelName { get; set; } = string.Empty;
    public int BillCount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal InsuranceAmount { get; set; }
    public decimal Rate { get; set; }
}

public class AssigneeStatisticsDto
{
    public int? AssigneeId { get; set; }
    public string AssigneeName { get; set; } = string.Empty;
    public int BillCount { get; set; }
    public int CompletedCount { get; set; }
    public int PendingCount { get; set; }
    public int RejectedCount { get; set; }
    public decimal CompletedRate { get; set; }
}

public class ReviewTagStatisticsDto
{
    public int ReviewTagId { get; set; }
    public string ReviewTagName { get; set; } = string.Empty;
    public int BillCount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Color { get; set; }
}

public class StatusOverviewDto
{
    public int StatusId { get; set; }
    public string StatusName { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Amount { get; set; }
}

public class DashboardDto
{
    public int TotalBills { get; set; }
    public int PendingBills { get; set; }
    public int CompletedBills { get; set; }
    public int ExceptionBills { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal InsuranceAmount { get; set; }
    public List<StatusOverviewDto> StatusOverview { get; set; } = new();
    public List<SourceChannelStatisticsDto> SourceChannelStats { get; set; } = new();
    public TrainingCompletionRateDto TrainingCompletionRate { get; set; } = new();
}
