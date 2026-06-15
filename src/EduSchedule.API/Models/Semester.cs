using System.ComponentModel.DataAnnotations;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Models;

public class Semester
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int AcademicYear { get; set; }

    [Required]
    public SemesterType Type { get; set; }

    [Required]
    public DateOnly StartDate { get; set; }

    [Required]
    public DateOnly EndDate { get; set; }

    public DateOnly? CourseSelectionStartDate { get; set; }
    public DateOnly? CourseSelectionEndDate { get; set; }
    public DateOnly? ScheduleStartDate { get; set; }
    public DateOnly? ScheduleEndDate { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsCurrent { get; set; }

    public ICollection<Course> Courses { get; set; } = new List<Course>();
    public ICollection<CourseSchedule> Schedules { get; set; } = new List<CourseSchedule>();
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}
