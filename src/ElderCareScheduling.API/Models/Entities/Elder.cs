using ElderCareScheduling.API.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElderCareScheduling.API.Models.Entities;

public class Elder
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public Gender Gender { get; set; }

    [Required]
    public DateTime DateOfBirth { get; set; }

    [MaxLength(18)]
    public string? IdCardNumber { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(100)]
    public string? EmergencyContact { get; set; }

    [MaxLength(20)]
    public string? EmergencyPhone { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [MaxLength(1000)]
    public string? MedicalHistory { get; set; }

    [MaxLength(1000)]
    public string? AllergyInfo { get; set; }

    [MaxLength(1000)]
    public string? DietaryRequirements { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    public SourceType SourceType { get; set; }

    [MaxLength(200)]
    public string? SourceDetail { get; set; }

    public Guid? CareLevelId { get; set; }

    [ForeignKey(nameof(CareLevelId))]
    public virtual CareLevel? CareLevel { get; set; }

    public virtual ICollection<Medication> Medications { get; set; } = new List<Medication>();

    public virtual ICollection<CareSchedule> Schedules { get; set; } = new List<CareSchedule>();

    public virtual ICollection<ExceptionRecord> ExceptionRecords { get; set; } = new List<ExceptionRecord>();

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Required]
    [MaxLength(50)]
    public string CreatedBy { get; set; } = string.Empty;

    public DateTime? UpdatedAt { get; set; }

    [MaxLength(50)]
    public string? UpdatedBy { get; set; }

    public bool IsActive { get; set; } = true;

    [NotMapped]
    public int Age => DateTime.Now.Year - DateOfBirth.Year - (DateTime.Now.DayOfYear < DateOfBirth.DayOfYear ? 1 : 0);
}
