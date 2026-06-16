using System.ComponentModel.DataAnnotations;
using ElderCare.Api.Models.Enums;

namespace ElderCare.Api.DTOs;

public class CreateVisitRuleDto
{
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
}

public class VisitRuleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int FrequencyDays { get; set; }
    public int RequiredDurationMinutes { get; set; }
    public int? AreaId { get; set; }
    public string? AreaName { get; set; }
    public string Priority { get; set; } = "Normal";
    public bool IsActive { get; set; }
}

public class CreateVisitRecordDto
{
    [Required]
    public int ElderlyId { get; set; }

    [Required]
    public int StaffId { get; set; }

    public int? RuleId { get; set; }

    [Required]
    public DateTime VisitDate { get; set; }

    [Required]
    public int Duration { get; set; }

    [Required]
    public VisitStatus Status { get; set; } = VisitStatus.Scheduled;

    [StringLength(500)]
    public string? Notes { get; set; }

    public DateTime? NextVisitDate { get; set; }
}

public class VisitRecordDto
{
    public int Id { get; set; }
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public int StaffId { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public int? RuleId { get; set; }
    public string? RuleName { get; set; }
    public DateTime VisitDate { get; set; }
    public int Duration { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime? NextVisitDate { get; set; }
}

public class VisitComplianceDto
{
    public int ElderlyId { get; set; }
    public string ElderlyName { get; set; } = string.Empty;
    public int TotalRequired { get; set; }
    public int Completed { get; set; }
    public int Missed { get; set; }
    public double ComplianceRate { get; set; }
}
