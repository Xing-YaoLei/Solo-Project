using CertSchedulePlatform.Entities;

namespace CertSchedulePlatform.DTOs;

public class CourseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CertificateId { get; set; }
    public string? CertificateName { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

public class ChapterDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public int CourseId { get; set; }
    public int? ParentChapterId { get; set; }
    public int SortOrder { get; set; }
    public decimal EstimatedHours { get; set; }
    public bool IsActive { get; set; }
    public List<ChapterDto>? ChildChapters { get; set; }
    public List<QuestionTagDto>? QuestionTags { get; set; }
}

public class AssignmentDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CourseId { get; set; }
    public int? ChapterId { get; set; }
    public string? ChapterTitle { get; set; }
    public AssignmentType Type { get; set; }
    public string? TypeText { get; set; }
    public DateTime? DueDate { get; set; }
    public int TotalQuestions { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public List<QuestionTagDto>? QuestionTags { get; set; }
}

public class QuestionTagDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ChapterId { get; set; }
    public int? AssignmentId { get; set; }
    public int QuestionCount { get; set; }
    public TagDifficulty Difficulty { get; set; }
    public string? DifficultyText { get; set; }
}
