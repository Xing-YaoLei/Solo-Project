using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Models;

public class Course
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(20)]
    public string CourseCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    [Column(TypeName = "decimal(5,2)")]
    public decimal Credits { get; set; }

    public int TotalHours { get; set; }
    public int WeeklyHours { get; set; }
    public int MaxStudents { get; set; }

    [Required]
    public int DepartmentId { get; set; }
    public Department Department { get; set; } = null!;

    [Required]
    public int SemesterId { get; set; }
    public Semester Semester { get; set; } = null!;

    public Enums.RoomType? RequiredRoomType { get; set; }

    [MaxLength(200)]
    public string? EquipmentRequirements { get; set; }

    public CourseStatus Status { get; set; } = CourseStatus.Draft;

    public int? PrerequisiteCourseId { get; set; }
    public Course? PrerequisiteCourse { get; set; }

    public ICollection<TeacherCourse> TeacherCourses { get; set; } = new List<TeacherCourse>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
    public ICollection<CourseSchedule> Schedules { get; set; } = new List<CourseSchedule>();
    public ICollection<Transcript> Transcripts { get; set; } = new List<Transcript>();
    public ICollection<Course> DependentCourses { get; set; } = new List<Course>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int? CreatedBy { get; set; }
}
