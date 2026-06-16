using System.ComponentModel.DataAnnotations;
using ElderCare.Api.Models.Enums;

namespace ElderCare.Api.Models;

public class VisitRecord
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ElderlyId { get; set; }

    [Required]
    public int StaffId { get; set; }

    public int? RuleId { get; set; }

    [Required]
    public DateTime VisitDate { get; set; }

    [Required]
    public int Duration { get; set; }

    [Required]
    public VisitStatus Status { get; set; } = VisitStatus.Scheduled;

    [StringLength(500)]
    public string? Notes { get; set; }

    public DateTime? NextVisitDate { get; set; }

    public ElderlyProfile Elderly { get; set; } = null!;
    public Staff Staff { get; set; } = null!;
    public VisitRecordRule? Rule { get; set; }
}
