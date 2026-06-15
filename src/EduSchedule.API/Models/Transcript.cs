using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace EduSchedule.API.Models;

public class Transcript
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
    public int EnrollmentId { get; set; }
    public Enrollment Enrollment { get; set; } = null!;

    [Required]
    public int SemesterId { get; set; }
    public Semester Semester { get; set; } = null!;

    [Column(TypeName = "decimal(5,2)")]
    public decimal? MidtermScore { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? FinalScore { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? AssignmentScore { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? AttendanceScore { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? FinalGrade { get; set; }

    [MaxLength(10)]
    public string? GradeLetter { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal? GradePoint { get; set; }

    [MaxLength(500)]
    public string? Comments { get; set; }

    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public int? PublishedBy { get; set; }

    public ICollection<TranscriptDetail> Details { get; set; } = new List<TranscriptDetail>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class TranscriptDetail
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TranscriptId { get; set; }
    public Transcript Transcript { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string ItemName { get; set; } = string.Empty;

    [Column(TypeName = "decimal(5,2)")]
    public decimal Score { get; set; }

    [Column(TypeName = "decimal(5,2)")]
    public decimal Weight { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
