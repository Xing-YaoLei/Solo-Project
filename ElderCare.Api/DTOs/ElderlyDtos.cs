using System.ComponentModel.DataAnnotations;

namespace ElderCare.Api.DTOs;

public class CreateElderlyDto
{
    [Required, StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(10)]
    public string Gender { get; set; } = string.Empty;

    [Required]
    public DateTime BirthDate { get; set; }

    [Required, StringLength(20)]
    public string RoomNumber { get; set; } = string.Empty;

    [Required]
    public int AreaId { get; set; }

    [Required]
    public int PrimaryStaffId { get; set; }

    [StringLength(500)]
    public string? HealthConditions { get; set; }

    [StringLength(100)]
    public string? EmergencyContact { get; set; }

    [StringLength(20)]
    public string? EmergencyPhone { get; set; }

    [Required]
    public DateTime AdmissionDate { get; set; }

    [StringLength(20)]
    public string Status { get; set; } = "Active";
}

public class UpdateElderlyDto
{
    [Required, StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, StringLength(10)]
    public string Gender { get; set; } = string.Empty;

    [Required]
    public DateTime BirthDate { get; set; }

    [Required, StringLength(20)]
    public string RoomNumber { get; set; } = string.Empty;

    [Required]
    public int AreaId { get; set; }

    [Required]
    public int PrimaryStaffId { get; set; }

    [StringLength(500)]
    public string? HealthConditions { get; set; }

    [StringLength(100)]
    public string? EmergencyContact { get; set; }

    [StringLength(20)]
    public string? EmergencyPhone { get; set; }

    [Required]
    public DateTime AdmissionDate { get; set; }

    [StringLength(20)]
    public string Status { get; set; } = "Active";
}

public class ElderlyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime BirthDate { get; set; }
    public string RoomNumber { get; set; } = string.Empty;
    public int AreaId { get; set; }
    public string AreaName { get; set; } = string.Empty;
    public int PrimaryStaffId { get; set; }
    public string PrimaryStaffName { get; set; } = string.Empty;
    public string? HealthConditions { get; set; }
    public string? EmergencyContact { get; set; }
    public string? EmergencyPhone { get; set; }
    public DateTime AdmissionDate { get; set; }
    public string Status { get; set; } = string.Empty;
}
