using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SiteSchedule.Models;

public enum ChangeType
{
    Schedule = 1,
    Status = 2,
    PersonInCharge = 3,
    Material = 4,
    Other = 99
}

public class TimelineChange
{
    [Key]
    public int Id { get; set; }

    public int SiteId { get; set; }

    [ForeignKey(nameof(SiteId))]
    public virtual ConstructionSite Site { get; set; } = null!;

    public ChangeType ChangeType { get; set; }

    [Required]
    [MaxLength(200)]
    public string ChangeTitle { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? ChangeDescription { get; set; }

    [MaxLength(500)]
    public string? OldValue { get; set; }

    [MaxLength(500)]
    public string? NewValue { get; set; }

    public DateTime? OldDate { get; set; }

    public DateTime? NewDate { get; set; }

    [MaxLength(50)]
    public string? OperatorName { get; set; }

    [MaxLength(50)]
    public string? OperatorRole { get; set; }

    public DateTime ChangeTime { get; set; } = DateTime.Now;

    [MaxLength(500)]
    public string? Remark { get; set; }
}
