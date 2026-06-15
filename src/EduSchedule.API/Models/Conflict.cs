using System.ComponentModel.DataAnnotations;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Models;

public class Conflict
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    public ConflictType Type { get; set; }

    [Required]
    public ConflictLevel Level { get; set; }

    [Required]
    public ConflictStatus Status { get; set; } = ConflictStatus.Pending;

    [Required]
    public int ClassroomId { get; set; }
    public Classroom Classroom { get; set; } = null!;

    public int? Schedule1Id { get; set; }
    public CourseSchedule? Schedule1 { get; set; }

    public int? Schedule2Id { get; set; }
    public CourseSchedule? Schedule2 { get; set; }

    public int? Teacher1Id { get; set; }
    public User? Teacher1 { get; set; }

    public int? Teacher2Id { get; set; }
    public User? Teacher2 { get; set; }

    public WeekDay? DayOfWeek { get; set; }
    public int? TimeSlotId { get; set; }
    public TimeSlot? TimeSlot { get; set; }

    public DateOnly? ConflictDate { get; set; }

    [MaxLength(500)]
    public string? Resolution { get; set; }

    public DateTime? ResolvedAt { get; set; }
    public int? ResolvedBy { get; set; }
    public User? ResolvedByUser { get; set; }

    public int? AssignedTo { get; set; }
    public User? AssignedToUser { get; set; }

    public ICollection<ConflictCommunication> Communications { get; set; } = new List<ConflictCommunication>();
    public ICollection<ConflictReview> Reviews { get; set; } = new List<ConflictReview>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public enum ConflictType
{
    ClassroomConflict,
    TeacherConflict,
    StudentConflict,
    TimeSlotOverlap,
    EquipmentShortage,
    CapacityExceeded
}
