using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EduSchedule.API.Models;

public class Student
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(30)]
    public string StudentNumber { get; set; } = string.Empty;

    [Required]
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    [Required]
    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    [MaxLength(50)]
    public string? Major { get; set; }

    [MaxLength(20)]
    public string? ClassName { get; set; }

    public int Grade { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal GPA { get; set; }

    public int TotalCredits { get; set; }

    public DateOnly? EnrollmentDate { get; set; }
    public DateOnly? ExpectedGraduationDate { get; set; }

    [MaxLength(100)]
    public string? Advisor { get; set; }

    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<Transcript> Transcripts { get; set; } = new List<Transcript>();
    public ICollection<Application> Applications { get; set; } = new List<Application>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
}
