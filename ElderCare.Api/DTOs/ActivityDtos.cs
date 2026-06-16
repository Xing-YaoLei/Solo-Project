using System.ComponentModel.DataAnnotations;
using ElderCare.Api.Models.Enums;

namespace ElderCare.Api.DTOs;

public class CreateThresholdDto
{
    [Required, StringLength(200)]
    public string ActivityName { get; set; } = string.Empty;

    [Required]
    public int RequiredCheckIns { get; set; }

    [Required]
    public int PeriodDays { get; set; }

    public int? AreaId { get; set; }

    public bool IsActive { get; set; } = true;
}

public class ThresholdDto
{
    public int Id { get; set; }
    public string ActivityName { get; set; } = string.Empty;
    public int RequiredCheckIns { get; set; }
    public int PeriodDays { get; set; }
    public int? AreaId { get; set; }
    public string? AreaName { get; set; }
    public bool IsActive { get; set; }
}

public class CreateCheckInDto
{
    [Required]
    public int ElderlyId { get; set; }

    [Required, StringLength(200)]
    public string ActivityName { get; set; } = string.Empty;

    [Required]
    public int StaffId { get; set; }

    [Required]
    public DateTime CheckInTime { get; set; }

    [Required]
    public CheckInStatus Status { get; set; } = CheckInStatus.CheckedIn;

    public int? ThresholdId { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}

public class CheckInDto
{
    public int Id { get; set; }
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public string ActivityName { get; set; } = string.Empty;
    public int StaffId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public DateTime CheckInTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? ThresholdId { get; set; }
    public string? Notes { get; set; }
}

public class CheckInStatsDto
{
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public string ActivityName { get; set; } = string.Empty;
    public int TotalCheckIns { get; set; }
    public int CheckedIn { get; set; }
    public int Absent { get; set; }
    public int Late { get; set; }
    public int Excused { get; set; }
    public bool IsCompliant { get; set; }
}
