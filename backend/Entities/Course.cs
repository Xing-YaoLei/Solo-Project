using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CertSchedulePlatform.Entities;

public class Course
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public int CertificateId { get; set; }

    [ForeignKey(nameof(CertificateId))]
    public Certificate? Certificate { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();

    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();

    public ICollection<LearningProgress> LearningProgresses { get; set; } = new List<LearningProgress>();
}
