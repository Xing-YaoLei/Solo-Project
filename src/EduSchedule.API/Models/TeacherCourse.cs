using System.ComponentModel.DataAnnotations;

namespace EduSchedule.API.Models;

public class TeacherCourse
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }
    public User Teacher { get; set; } = null!;

    [Required]
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public bool IsMainTeacher { get; set; } = true;

    [MaxLength(200)]
    public string? TeachingRole { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
