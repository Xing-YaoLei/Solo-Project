using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Models;

public class Enrollment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    [Required]
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    [Required]
    public int SemesterId { get; set; }
    public Semester Semester { get; set; } = null!;

    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Enrolled;

    [Column(TypeName = "decimal(5,2)")]
    public decimal? Grade { get; set; }

    [MaxLength(10)]
    public string? GradeLetter { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime? DropDate { get; set; }

    public ICollection<Transcript> Transcripts { get; set; } = new List<Transcript>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public enum EnrollmentStatus
{
    Enrolled,
    Dropped,
    Withdrawn,
    Completed,
    Failed
}
