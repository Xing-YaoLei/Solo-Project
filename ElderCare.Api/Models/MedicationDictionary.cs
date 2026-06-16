using System.ComponentModel.DataAnnotations;

namespace ElderCare.Api.Models;

public class MedicationDictionary
{
    [Key]
    public int Id { get; set; }

    [Required, StringLength(200)]
    public string MedicineName { get; set; } = string.Empty;

    [StringLength(200)]
    public string? GenericName { get; set; }

    [StringLength(50)]
    public string? DosageForm { get; set; }

    [StringLength(100)]
    public string? DefaultDosage { get; set; }

    [StringLength(20)]
    public string? Unit { get; set; }

    [StringLength(50)]
    public string? Frequency { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(500)]
    public string? SideEffects { get; set; }

    [StringLength(500)]
    public string? Contraindications { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<MedicationSchedule> MedicationSchedules { get; set; } = new List<MedicationSchedule>();
}
