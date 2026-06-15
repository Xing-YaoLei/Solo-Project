using System.ComponentModel.DataAnnotations;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Models;

public class Classroom
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string RoomNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Location { get; set; }

    [Required]
    public RoomType Type { get; set; }

    [Required]
    public int Capacity { get; set; }

    [MaxLength(500)]
    public string? Equipment { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public string? Floor { get; set; }
    public string? Building { get; set; }

    public bool HasProjector { get; set; }
    public bool HasWhiteboard { get; set; }
    public bool HasMicrophone { get; set; }
    public bool HasSoundSystem { get; set; }
    public bool HasAirConditioning { get; set; }
    public bool IsDisabledAccessible { get; set; }

    public ICollection<CourseSchedule> Schedules { get; set; } = new List<CourseSchedule>();
    public ICollection<Conflict> Conflicts { get; set; } = new List<Conflict>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; } = true;
}
