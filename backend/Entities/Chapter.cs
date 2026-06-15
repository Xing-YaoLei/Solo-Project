using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CertSchedulePlatform.Entities;

public class Chapter
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Content { get; set; }

    public int CourseId { get; set; }

    [ForeignKey(nameof(CourseId))]
    public Course? Course { get; set; }

    public int? ParentChapterId { get; set; }

    [ForeignKey(nameof(ParentChapterId))]
    public Chapter? ParentChapter { get; set; }

    public int SortOrder { get; set; }

    public decimal EstimatedHours { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<Chapter> ChildChapters { get; set; } = new List<Chapter>();

    public ICollection<QuestionTag> QuestionTags { get; set; } = new List<QuestionTag>();
}
