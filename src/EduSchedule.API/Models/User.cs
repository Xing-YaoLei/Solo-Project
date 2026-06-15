using System.ComponentModel.DataAnnotations;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Models;

public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string RealName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public RoleType Role { get; set; }

    [MaxLength(50)]
    public string RoleName { get; set; } = string.Empty;

    public int? DepartmentId { get; set; }
    public Department? Department { get; set; }

    [MaxLength(100)]
    public string? DepartmentName { get; set; }

    [MaxLength(100)]
    public string? Title { get; set; }

    public string? AvatarUrl { get; set; }

    public ICollection<TeacherCourse> TeacherCourses { get; set; } = new List<TeacherCourse>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<ApprovalRecord> ApprovedRecords { get; set; } = new List<ApprovalRecord>();
    public ICollection<ConflictCommunication> Communications { get; set; } = new List<ConflictCommunication>();
    public ICollection<ConflictReview> Reviews { get; set; } = new List<ConflictReview>();
    public ICollection<Application> SubmittedApplications { get; set; } = new List<Application>();
    public ICollection<Application> ProcessedApplications { get; set; } = new List<Application>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;
}
