using System.ComponentModel.DataAnnotations;

namespace ElderCare.Api.Models;

public class VisitRecordRule
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public int FrequencyDays { get; set; }

    [Required]
    public int RequiredDurationMinutes { get; set; }

    public int? AreaId { get; set; }

    [Required, StringLength(20)]
    public string Priority { get; set; } = "Normal";

    public bool IsActive { get; set; } = true;

    public Area? Area { get; set; }
    public ICollection<VisitRecord> VisitRecords { get; set; } = new List<VisitRecord>();
}
