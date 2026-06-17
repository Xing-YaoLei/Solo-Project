using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SiteSchedule.Models;

public class TagGroupRule
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string TagName { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Color { get; set; }

    public int? AreaId { get; set; }

    [ForeignKey(nameof(AreaId))]
    public virtual Area? Area { get; set; }

    public int? PersonInChargeId { get; set; }

    [ForeignKey(nameof(PersonInChargeId))]
    public virtual PersonInCharge? PersonInCharge { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
