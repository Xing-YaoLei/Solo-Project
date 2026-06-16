using System.ComponentModel.DataAnnotations;
using ElderCare.Api.Models.Enums;

namespace ElderCare.Api.Models;

public class ActivityCheckIn
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ElderlyId { get; set; }

    [Required, StringLength(200)]
    public string ActivityName { get; set; } = string.Empty;

    [Required]
    public int StaffId { get; set; }

    [Required]
    public DateTime CheckInTime { get; set; }

    [Required]
    public CheckInStatus Status { get; set; } = CheckInStatus.CheckedIn;

    public int? ThresholdId { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }

    public ElderlyProfile Elderly { get; set; } = null!;
    public Staff Staff { get; set; } = null!;
    public ActivityCheckInThreshold? Threshold { get; set; }
}
