using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CertSchedulePlatform.Entities;

public class Certificate
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Code { get; set; }

    public DateTime? ExamDate { get; set; }

    public DateTime? RegistrationStart { get; set; }

    public DateTime? RegistrationEnd { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<Course> Courses { get; set; } = new List<Course>();

    public ICollection<LearningProgress> LearningProgresses { get; set; } = new List<LearningProgress>();
}
