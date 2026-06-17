using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SiteSchedule.Models;

public enum ConfirmationStatus
{
    Pending = 0,
    Confirmed = 1,
    Rejected = 2,
    Cancelled = 3
}

public class ScheduleConfirmation
{
    [Key]
    public int Id { get; set; }

    public int SiteId { get; set; }

    [ForeignKey(nameof(SiteId))]
    public virtual ConstructionSite Site { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string ConfirmationTitle { get; set; } = string.Empty;

    public DateTime? ScheduledDate { get; set; }

    [MaxLength(500)]
    public string? Location { get; set; }

    [MaxLength(1000)]
    public string? ConfirmationContent { get; set; }

    public ConfirmationStatus Status { get; set; } = ConfirmationStatus.Pending;

    public DateTime? ConfirmedAt { get; set; }

    [MaxLength(50)]
    public string? ConfirmedBy { get; set; }

    [MaxLength(500)]
    public string? RejectReason { get; set; }

    public DateTime? CustomerSignTime { get; set; }

    [MaxLength(50)]
    public string? CustomerSignName { get; set; }

    [MaxLength(500)]
    public string? Remark { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public virtual ICollection<MaterialSubmission> MaterialSubmissions { get; set; } = new List<MaterialSubmission>();

    public virtual ICollection<ActionLog> ActionLogs { get; set; } = new List<ActionLog>();
}
