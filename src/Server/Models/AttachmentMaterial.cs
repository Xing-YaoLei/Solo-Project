using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SiteSchedule.Models;

public enum MaterialCategory
{
    Identity = 1,
    Contract = 2,
    Drawing = 3,
    Payment = 4,
    Acceptance = 5,
    Other = 99
}

public class AttachmentMaterial
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public MaterialCategory Category { get; set; }

    public bool IsRequired { get; set; }

    public int SortOrder { get; set; }

    [MaxLength(200)]
    public string? FileExtensions { get; set; }

    public long? MaxFileSize { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;

    [MaxLength(50)]
    public string? CreatedBy { get; set; }

    [MaxLength(50)]
    public string? UpdatedBy { get; set; }
}
