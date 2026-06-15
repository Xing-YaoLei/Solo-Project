using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CertSchedulePlatform.Entities;

public class QuestionTag
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    public int? ChapterId { get; set; }

    [ForeignKey(nameof(ChapterId))]
    public Chapter? Chapter { get; set; }

    public int? AssignmentId { get; set; }

    [ForeignKey(nameof(AssignmentId))]
    public Assignment? Assignment { get; set; }

    public int QuestionCount { get; set; }

    public TagDifficulty Difficulty { get; set; } = TagDifficulty.Medium;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}

public enum TagDifficulty
{
    Easy = 1,
    Medium = 2,
    Hard = 3
}
