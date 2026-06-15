using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CertSchedulePlatform.Entities;

public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FullName { get; set; }

    public UserRole Role { get; set; } = UserRole.Student;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<LearningProgress> LearningProgresses { get; set; } = new List<LearningProgress>();

    public ICollection<AssignmentRecord> AssignmentRecords { get; set; } = new List<AssignmentRecord>();

    public ICollection<ProgressAlert> ProgressAlerts { get; set; } = new List<ProgressAlert>();

    public ICollection<ExportRecord> ExportRecords { get; set; } = new List<ExportRecord>();
}

public enum UserRole
{
    Student = 1,
    Teacher = 2,
    Admin = 3
}
