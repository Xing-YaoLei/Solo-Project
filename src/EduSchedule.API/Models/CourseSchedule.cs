using System.ComponentModel.DataAnnotations;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Models;

public class CourseSchedule
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    [Required]
    public int ClassroomId { get; set; }
    public Classroom Classroom { get; set; } = null!;

    [Required]
    public int TimeSlotId { get; set; }
    public TimeSlot TimeSlot { get; set; } = null!;

    [Required]
    public int SemesterId { get; set; }
    public Semester Semester { get; set; } = null!;

    [Required]
    public WeekDay DayOfWeek { get; set; }

    [MaxLength(200)]
    public string? Weeks { get; set; }

    public int StartWeek { get; set; } = 1;
    public int EndWeek { get; set; } = 16;

    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Draft;

    public ICollection<Conflict> Conflicts { get; set; } = new List<Conflict>();
    public ICollection<ApprovalRecord> ApprovalRecords { get; set; } = new List<ApprovalRecord>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public int? CreatedBy { get; set; }
}
