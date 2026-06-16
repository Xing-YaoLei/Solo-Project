using ElderCareScheduling.API.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElderCareScheduling.API.Models.Entities;

public class ScheduleStatusHistory
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ScheduleId { get; set; }

    [ForeignKey(nameof(ScheduleId))]
    public virtual CareSchedule? Schedule { get; set; }

    [Required]
    public ScheduleStatus PreviousStatus { get; set; }

    [Required]
    public ScheduleStatus NewStatus { get; set; }

    [MaxLength(1000)]
    public string? ChangeReason { get; set; }

    [Required]
    public DateTime ChangedAt { get; set; } = DateTime.Now;

    [Required]
    [MaxLength(50)]
    public string ChangedBy { get; set; } = string.Empty;
}
