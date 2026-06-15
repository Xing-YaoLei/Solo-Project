using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.DTOs;

public class LearningProgressDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public int CertificateId { get; set; }
    public string? CertificateName { get; set; }
    public int? CourseId { get; set; }
    public string? CourseName { get; set; }
    public decimal CompletionRate { get; set; }
    public decimal TargetRate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? TargetDate { get; set; }
    public ProgressStatus Status { get; set; }
    public string? StatusText { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class LearningProgressCreateDto
{
    public int UserId { get; set; }
    public int CertificateId { get; set; }
    public int? CourseId { get; set; }
    public decimal TargetRate { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? TargetDate { get; set; }
    public string? Note { get; set; }
}

public class LearningProgressUpdateDto
{
    public decimal CompletionRate { get; set; }
    public ProgressStatus? Status { get; set; }
    public string? Note { get; set; }
    public string? ChangeReason { get; set; }
    public int ChangedByUserId { get; set; }
}

public class ProgressHistoryDto
{
    public int Id { get; set; }
    public int LearningProgressId { get; set; }
    public decimal OldCompletionRate { get; set; }
    public decimal NewCompletionRate { get; set; }
    public ProgressStatus OldStatus { get; set; }
    public string? OldStatusText { get; set; }
    public ProgressStatus NewStatus { get; set; }
    public string? NewStatusText { get; set; }
    public string? OldNote { get; set; }
    public string? NewNote { get; set; }
    public int ChangedByUserId { get; set; }
    public string? ChangedByName { get; set; }
    public string? ChangeReason { get; set; }
    public DateTime ChangedAt { get; set; }
}

public class LearningProgressDetailDto
{
    public LearningProgressDto Progress { get; set; } = new();
    public List<ChapterDto> Chapters { get; set; } = new();
    public List<AssignmentRecordDto> AssignmentRecords { get; set; } = new();
    public List<QuestionTagDto> QuestionTags { get; set; } = new();
    public List<ProgressHistoryDto> History { get; set; } = new();
}
