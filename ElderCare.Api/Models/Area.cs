using System.ComponentModel.DataAnnotations;

namespace ElderCare.Api.Models;

public class Area
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public ICollection<Staff> Staff { get; set; } = new List<Staff>();
    public ICollection<ElderlyProfile> ElderlyProfiles { get; set; } = new List<ElderlyProfile>();
    public ICollection<RiskEvent> RiskEvents { get; set; } = new List<RiskEvent>();
}
