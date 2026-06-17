using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Dtos.AttachmentMaterial;

public class AttachmentMaterialDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public MaterialCategory Category { get; set; }
    public string CategoryText { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
    public string? FileExtensions { get; set; }
    public long? MaxFileSize { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

public class AttachmentMaterialQueryDto : PagedQuery
{
    public string? Name { get; set; }
    public MaterialCategory? Category { get; set; }
    public bool? IsRequired { get; set; }
    public bool? IsActive { get; set; }
}

public class AttachmentMaterialCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public MaterialCategory Category { get; set; }
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
    public string? FileExtensions { get; set; }
    public long? MaxFileSize { get; set; }
    public bool IsActive { get; set; } = true;
}

public class AttachmentMaterialUpdateDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public MaterialCategory Category { get; set; }
    public bool IsRequired { get; set; }
    public int SortOrder { get; set; }
    public string? FileExtensions { get; set; }
    public long? MaxFileSize { get; set; }
    public bool IsActive { get; set; }
}
