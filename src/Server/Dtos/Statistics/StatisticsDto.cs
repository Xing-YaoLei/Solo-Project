namespace SiteSchedule.Dtos.Statistics;

public class MaterialCompleteRateDto
{
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public string AreaName { get; set; } = string.Empty;
    public string PersonInChargeName { get; set; } = string.Empty;
    public int TotalRequiredCount { get; set; }
    public int SubmittedCount { get; set; }
    public int ApprovedCount { get; set; }
    public int MissingCount { get; set; }
    public double CompleteRate { get; set; }
    public double ApprovedRate { get; set; }
}

public class StatisticsOverviewDto
{
    public int TotalSites { get; set; }
    public int PendingSites { get; set; }
    public int InProgressSites { get; set; }
    public int ToBeConfirmedSites { get; set; }
    public int ConfirmedSites { get; set; }
    public int CompletedSites { get; set; }
    public int TotalMaterials { get; set; }
    public int SubmittedMaterials { get; set; }
    public int ApprovedMaterials { get; set; }
    public int MissingMaterials { get; set; }
    public double OverallCompleteRate { get; set; }
    public double OverallApprovedRate { get; set; }
    public int PendingNotifications { get; set; }
    public int TodayNotifications { get; set; }
}

public class AreaStatisticsDto
{
    public int AreaId { get; set; }
    public string AreaName { get; set; } = string.Empty;
    public int SiteCount { get; set; }
    public double AvgCompleteRate { get; set; }
    public int MissingMaterialCount { get; set; }
}

public class PersonStatisticsDto
{
    public int PersonId { get; set; }
    public string PersonName { get; set; } = string.Empty;
    public int SiteCount { get; set; }
    public double AvgCompleteRate { get; set; }
    public int MissingMaterialCount { get; set; }
}

public class MaterialStatisticsDto
{
    public int MaterialId { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int TotalSites { get; set; }
    public int SubmittedCount { get; set; }
    public int ApprovedCount { get; set; }
    public double SubmissionRate { get; set; }
    public double ApprovalRate { get; set; }
}

public class ReviewQueryDto
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? AreaId { get; set; }
    public int? PersonInChargeId { get; set; }
    public string? TagGroup { get; set; }
}
