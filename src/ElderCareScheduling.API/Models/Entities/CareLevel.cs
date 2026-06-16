using ElderCareScheduling.API.Enums;
using System.ComponentModel.DataAnnotations;

namespace ElderCareScheduling.API.Models.Entities;

public class CareLevel
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public CareLevelType LevelType { get; set; }

    [Required]
    [MaxLength(100)]
    public string LevelName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(2000)]
    public string? CareItems { get; set; }

    [MaxLength(2000)]
    public string? ServiceStandards { get; set; }

    public int DailyCareHours { get; set; }

    public int NurseRatio { get; set; }

    public decimal? MonthlyFee { get; set; }

    public virtual ICollection<Elder> Elders { get; set; } = new List<Elder>();

    public virtual ICollection<CareSchedule> Schedules { get; set; } = new List<CareSchedule>();

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime? UpdatedAt { get; set; }

    public bool IsActive { get; set; } = true;
}
