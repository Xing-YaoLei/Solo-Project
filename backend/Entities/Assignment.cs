using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CertSchedulePlatform.Entities;

public class Assignment
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public int CourseId { get; set; }

    [ForeignKey(nameof(CourseId))]
    public Course? Course { get; set; }

    public int? ChapterId { get; set; }

    [ForeignKey(nameof(ChapterId))]
    public Chapter? Chapter { get; set; }

    public AssignmentType Type { get; set; }

    public DateTime? DueDate { get; set; }

    public int TotalQuestions { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<AssignmentRecord> AssignmentRecords { get; set; } = new List<AssignmentRecord>();

    public ICollection<QuestionTag> QuestionTags { get; set; } = new List<QuestionTag>();
}

public enum AssignmentType
{
    Practice = 1,
    MockExam = 2,
    Homework = 3,
    Quiz = 4
}
