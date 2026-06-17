using SiteSchedule.Dtos.Common;

namespace SiteSchedule.Dtos.TagGroupRule;

public class TagGroupRuleDto
{
    public int Id { get; set; }
    public string TagName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }
    public int? AreaId { get; set; }
    public string? AreaName { get; set; }
    public int? PersonInChargeId { get; set; }
    public string? PersonInChargeName { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class TagGroupRuleQueryDto : PagedQuery
{
    public string? TagName { get; set; }
    public int? AreaId { get; set; }
    public int? PersonInChargeId { get; set; }
    public bool? IsActive { get; set; }
}

public class TagGroupRuleCreateDto
{
    public string TagName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }
    public int? AreaId { get; set; }
    public int? PersonInChargeId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public class TagGroupRuleUpdateDto
{
    public int Id { get; set; }
    public string TagName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Color { get; set; }
    public int? AreaId { get; set; }
    public int? PersonInChargeId { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}
