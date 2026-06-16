using System.ComponentModel.DataAnnotations;
using ElderCare.Api.Models.Enums;

namespace ElderCare.Api.Models;

public class RiskEventReminder
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int RiskEventId { get; set; }

    [Required]
    public ReminderActionType ActionType { get; set; }

    [Required]
    public int StaffId { get; set; }

    [Required, StringLength(1000)]
    public string Message { get; set; } = string.Empty;

    [Required]
    public DateTime ActionTime { get; set; }

    public bool IsSuccessful { get; set; }

    public int RetryCount { get; set; }

    public int? ParentReminderId { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public RiskEvent RiskEvent { get; set; } = null!;
    public Staff Staff { get; set; } = null!;
    public RiskEventReminder? ParentReminder { get; set; }
    public ICollection<RiskEventReminder> ChildReminders { get; set; } = new List<RiskEventReminder>();
}
