using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SiteSchedule.Models;

public enum AuthScopeType
{
    Area = 1,
    PersonInCharge = 2,
    Budget = 3,
    Status = 4
}

public class AuthScopeThreshold
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string RoleName { get; set; } = string.Empty;

    public AuthScopeType ScopeType { get; set; }

    [MaxLength(500)]
    public string? ScopeValue { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? MinValue { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? MaxValue { get; set; }

    public bool CanApprove { get; set; }

    public bool CanEdit { get; set; }

    public bool CanView { get; set; } = true;

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
