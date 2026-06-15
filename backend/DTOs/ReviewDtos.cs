using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.DTOs;

public class MonthlyReviewDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int CertificateId { get; set; }
    public string? CertificateName { get; set; }
    public List<CourseReviewDto> CourseReviews { get; set; } = new();
    public decimal OverallCompletionRate { get; set; }
    public int TotalStudents { get; set; }
    public int StudentsOnTrack { get; set; }
    public int StudentsBehind { get; set; }
    public int StudentsCompleted { get; set; }
    public int TotalAssignments { get; set; }
    public int CompletedAssignments { get; set; }
    public decimal AssignmentCompletionRate { get; set; }
}

public class CourseReviewDto
{
    public int CourseId { get; set; }
    public string? CourseName { get; set; }
    public decimal AverageCompletionRate { get; set; }
    public int TotalStudents { get; set; }
    public int StudentsOnTrack { get; set; }
    public int StudentsBehind { get; set; }
    public int AssignmentCount { get; set; }
    public int CompletedAssignmentCount { get; set; }
    public decimal AverageScore { get; set; }
}

public class MonthlyReviewQueryDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int? CertificateId { get; set; }
    public int? CourseId { get; set; }
}

public class ExportRequestDto
{
    public ExportType ExportType { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? CertificateId { get; set; }
    public int? CourseId { get; set; }
    public int? UserId { get; set; }
    public int GeneratedByUserId { get; set; }
    public string? AdditionalFilters { get; set; }
}

public class ExportRecordDto
{
    public int Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public ExportType ExportType { get; set; }
    public string? ExportTypeText { get; set; }
    public string? FilterCriteria { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int TotalRecords { get; set; }
    public int GeneratedByUserId { get; set; }
    public string? GeneratedByName { get; set; }
    public DateTime GeneratedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
