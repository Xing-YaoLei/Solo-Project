using System.ComponentModel.DataAnnotations;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Models;

public class Application
{
    [Key]
    public int Id { get; set; }

    [Required]
    public ApplicationType Type { get; set; }

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Required]
    public int ApplicantId { get; set; }
    public User Applicant { get; set; } = null!;

    public int? StudentId { get; set; }
    public Student? Student { get; set; }

    public int? CourseId { get; set; }
    public Course? Course { get; set; }

    public int? SemesterId { get; set; }
    public Semester? Semester { get; set; }

    public ApplicationStatus Status { get; set; } = ApplicationStatus.Pending;

    public int? ProcessorId { get; set; }
    public User? Processor { get; set; }

    [MaxLength(2000)]
    public string? ProcessorComments { get; set; }

    public int? TargetCourseId { get; set; }
    public Course? TargetCourse { get; set; }

    public DateTime? ProcessedAt { get; set; }

    public ICollection<ApplicationAttachment> Attachments { get; set; } = new List<ApplicationAttachment>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public enum ApplicationType
{
    CourseAdd,
    CourseDrop,
    CourseSwap,
    CreditOverride,
    PrerequisiteWaiver,
    GradeAppeal,
    LeaveOfAbsence,
    Withdrawal,
    Other
}

public enum ApplicationStatus
{
    Draft,
    Pending,
    UnderReview,
    Approved,
    Rejected,
    Cancelled
}

public class ApplicationAttachment
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ApplicationId { get; set; }
    public Application Application { get; set; } = null!;

    [Required]
    [MaxLength(200)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ContentType { get; set; }

    public long FileSize { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
