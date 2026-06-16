using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElderCareScheduling.API.Models.Entities;

public class Medication
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ElderId { get; set; }

    [ForeignKey(nameof(ElderId))]
    public virtual Elder? Elder { get; set; }

    [Required]
    [MaxLength(200)]
    public string DrugName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? GenericName { get; set; }

    [MaxLength(100)]
    public string? Specification { get; set; }

    [MaxLength(100)]
    public string? Dosage { get; set; }

    [MaxLength(200)]
    public string? Frequency { get; set; }

    [MaxLength(100)]
    public string? AdministrationRoute { get; set; }

    [MaxLength(500)]
    public string? UsageInstructions { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    [MaxLength(500)]
    public string? PrescribingDoctor { get; set; }

    [MaxLength(1000)]
    public string? Precautions { get; set; }

    [MaxLength(500)]
    public string? SideEffects { get; set; }

    public int? RemainingQuantity { get; set; }

    [MaxLength(200)]
    public string? StorageConditions { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Required]
    [MaxLength(50)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? UpdatedAt { get; set; }

    [MaxLength(50)]
    public string? UpdatedBy { get; set; }
}
