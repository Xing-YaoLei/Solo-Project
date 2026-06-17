using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SiteSchedule.Models;

public enum SiteStatus
{
    Pending = 0,
    InProgress = 1,
    ToBeConfirmed = 2,
    Confirmed = 3,
    Completed = 4,
    Closed = 5
}

public class ConstructionSite
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string SiteName { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Address { get; set; } = string.Empty;

    public int CustomerId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public virtual CustomerProfile Customer { get; set; } = null!;

    public int AreaId { get; set; }

    [ForeignKey(nameof(AreaId))]
    public virtual Area Area { get; set; } = null!;

    public int PersonInChargeId { get; set; }

    [ForeignKey(nameof(PersonInChargeId))]
    public virtual PersonInCharge PersonInCharge { get; set; } = null!;

    public SiteStatus Status { get; set; } = SiteStatus.Pending;

    [MaxLength(50)]
    public string? TagGroup { get; set; }

    public DateTime? PlannedStartDate { get; set; }

    public DateTime? PlannedEndDate { get; set; }

    public DateTime? ActualStartDate { get; set; }

    public DateTime? ActualEndDate { get; set; }

    public DateTime? ConfirmationDeadline { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? Budget { get; set; }

    [MaxLength(1000)]
    public string? Remark { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    public virtual ICollection<ScheduleConfirmation> ScheduleConfirmations { get; set; } = new List<ScheduleConfirmation>();

    public virtual ICollection<TimelineChange> TimelineChanges { get; set; } = new List<TimelineChange>();

    public virtual ICollection<MaterialSubmission> MaterialSubmissions { get; set; } = new List<MaterialSubmission>();

    public virtual ICollection<NotificationRecord> NotificationRecords { get; set; } = new List<NotificationRecord>();

    public virtual ICollection<ActionLog> ActionLogs { get; set; } = new List<ActionLog>();
}
