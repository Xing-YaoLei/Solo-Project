using SiteSchedule.Dtos.Common;
using SiteSchedule.Models;

namespace SiteSchedule.Dtos.MaterialSubmission;

public class MaterialSubmissionDto
{
    public int Id { get; set; }
    public int SiteId { get; set; }
    public string SiteName { get; set; } = string.Empty;
    public int? ConfirmationId { get; set; }
    public int MaterialId { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public MaterialCategory MaterialCategory { get; set; }
    public string MaterialCategoryText { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public SubmissionStatus Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public string? FilePath { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? Remark { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public string? SubmittedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewedBy { get; set; }
    public string? ReviewComment { get; set; }
    public int RetryCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class MaterialSubmissionQueryDto : PagedQuery
{
    public int? SiteId { get; set; }
    public int? MaterialId { get; set; }
    public SubmissionStatus? Status { get; set; }
    public MaterialCategory? Category { get; set; }
    public DateTime? SubmittedFrom { get; set; }
    public DateTime? SubmittedTo { get; set; }
}

public class MaterialSubmissionCreateDto
{
    public int SiteId { get; set; }
    public int? ConfirmationId { get; set; }
    public int MaterialId { get; set; }
    public string? FilePath { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? Remark { get; set; }
    public string? SubmittedBy { get; set; }
}

public class MaterialSubmissionUpdateDto
{
    public int Id { get; set; }
    public SubmissionStatus Status { get; set; }
    public string? FilePath { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? Remark { get; set; }
}

public class MaterialSubmissionReviewDto
{
    public int Id { get; set; }
    public SubmissionStatus Status { get; set; }
    public string? ReviewComment { get; set; }
    public string? ReviewedBy { get; set; }
}

public class MaterialSubmissionRetryDto
{
    public int Id { get; set; }
    public string? FilePath { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? Remark { get; set; }
    public string? OperatorName { get; set; }
}

public class MaterialSubmissionCloseDto
{
    public int Id { get; set; }
    public string? Remark { get; set; }
    public string? OperatorName { get; set; }
}
