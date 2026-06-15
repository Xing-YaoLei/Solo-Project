using System.ComponentModel.DataAnnotations;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Models;

public class ApprovalRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ScheduleId { get; set; }
    public CourseSchedule Schedule { get; set; } = null!;

    [Required]
    public int ApproverId { get; set; }
    public User Approver { get; set; } = null!;

    [Required]
    public ApprovalStatus Status { get; set; }

    [MaxLength(2000)]
    public string? Comments { get; set; }

    public int ApprovalLevel { get; set; }

    [MaxLength(100)]
    public string? RoleWhenApproved { get; set; }

    public DateTime? SubmittedAt { get; set; }
    public DateTime? ApprovedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
