using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Dtos.ConstructionSite;

public class ConstructionSiteDto
{
    public int Id { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public int AreaId { get; set; }
    public string AreaName { get; set; } = string.Empty;
    public int PersonInChargeId { get; set; }
    public string PersonInChargeName { get; set; } = string.Empty;
    public string PersonInChargePhone { get; set; } = string.Empty;
    public SiteStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public string? TagGroup { get; set; }
    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public DateTime? ConfirmationDeadline { get; set; }
    public decimal? Budget { get; set; }
    public string? Remark { get; set; }
    public double MaterialCompleteRate { get; set; }
    public int TotalMaterialCount { get; set; }
    public int SubmittedMaterialCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class ConstructionSiteQueryDto : PagedQuery
{
    public string? SiteName { get; set; }
    public SiteStatus? Status { get; set; }
    public int? AreaId { get; set; }
    public int? PersonInChargeId { get; set; }
    public DateTime? StartDateFrom { get; set; }
    public DateTime? StartDateTo { get; set; }
    public DateTime? EndDateFrom { get; set; }
    public DateTime? EndDateTo { get; set; }
    public string? TagGroup { get; set; }
    public string? CustomerName { get; set; }
}

public class ConstructionSiteCreateDto
{
    public string SiteName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public int AreaId { get; set; }
    public int PersonInChargeId { get; set; }
    public SiteStatus Status { get; set; } = SiteStatus.Pending;
    public string? TagGroup { get; set; }
    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public DateTime? ConfirmationDeadline { get; set; }
    public decimal? Budget { get; set; }
    public string? Remark { get; set; }
}

public class ConstructionSiteUpdateDto
{
    public int Id { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public int AreaId { get; set; }
    public int PersonInChargeId { get; set; }
    public SiteStatus Status { get; set; }
    public string? TagGroup { get; set; }
    public DateTime? PlannedStartDate { get; set; }
    public DateTime? PlannedEndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public DateTime? ConfirmationDeadline { get; set; }
    public decimal? Budget { get; set; }
    public string? Remark { get; set; }
}

public class ConstructionSiteStatusUpdateDto
{
    public int Id { get; set; }
    public SiteStatus Status { get; set; }
    public string? Remark { get; set; }
}
