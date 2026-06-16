using System.ComponentModel.DataAnnotations;

namespace ElderCare.Api.Models;

public class ActivityCheckInThreshold
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(200)]
    public string ActivityName { get; set; } = string.Empty;

    [Required]
    public int RequiredCheckIns { get; set; }

    [Required]
    public int PeriodDays { get; set; }

    public int? AreaId { get; set; }

    public bool IsActive { get; set; } = true;

    public Area? Area { get; set; }
    public ICollection<ActivityCheckIn> ActivityCheckIns { get; set; } = new List<ActivityCheckIn>();
}
