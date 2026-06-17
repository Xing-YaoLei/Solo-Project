using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Dtos.AuthScopeThreshold;

public class AuthScopeThresholdDto
{
    public int Id { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public AuthScopeType ScopeType { get; set; }
    public string ScopeTypeText { get; set; } = string.Empty;
    public string? ScopeValue { get; set; }
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public bool CanApprove { get; set; }
    public bool CanEdit { get; set; }
    public bool CanView { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class AuthScopeThresholdQueryDto : PagedQuery
{
    public string? RoleName { get; set; }
    public AuthScopeType? ScopeType { get; set; }
    public bool? IsActive { get; set; }
}

public class AuthScopeThresholdCreateDto
{
    public string RoleName { get; set; } = string.Empty;
    public AuthScopeType ScopeType { get; set; }
    public string? ScopeValue { get; set; }
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public bool CanApprove { get; set; }
    public bool CanEdit { get; set; }
    public bool CanView { get; set; } = true;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AuthScopeThresholdUpdateDto
{
    public int Id { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public AuthScopeType ScopeType { get; set; }
    public string? ScopeValue { get; set; }
    public decimal? MinValue { get; set; }
    public decimal? MaxValue { get; set; }
    public bool CanApprove { get; set; }
    public bool CanEdit { get; set; }
    public bool CanView { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}
