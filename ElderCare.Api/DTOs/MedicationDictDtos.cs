using System.ComponentModel.DataAnnotations;

namespace ElderCare.Api.DTOs;

public class CreateMedicationDictDto
{
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
}

public class UpdateMedicationDictDto
{
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
}

public class MedicationDictDto
{
    public int Id { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string? GenericName { get; set; }
    public string? DosageForm { get; set; }
    public string? DefaultDosage { get; set; }
    public string? Unit { get; set; }
    public string? Frequency { get; set; }
    public string? Category { get; set; }
    public string? SideEffects { get; set; }
    public string? Contraindications { get; set; }
    public bool IsActive { get; set; }
}
