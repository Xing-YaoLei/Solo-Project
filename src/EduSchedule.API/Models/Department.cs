using System.ComponentModel.DataAnnotations;

namespace EduSchedule.API.Models;

public class Department
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public int? HeadId { get; set; }
    public User? Head { get; set; }

    public ICollection<Course> Courses { get; set; } = new List<Course>();
    public ICollection<User> Users { get; set; } = new List<User>();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
}
