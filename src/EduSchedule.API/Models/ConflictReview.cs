using System.ComponentModel.DataAnnotations;
using EduSchedule.API.Enums;

namespace EduSchedule.API.Models;

public class ConflictReview
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ConflictId { get; set; }
    public Conflict Conflict { get; set; } = null!;

    [Required]
    public int ReviewerId { get; set; }
    public User Reviewer { get; set; } = null!;

    [Required]
    [MaxLength(2000)]
    public string ReviewOpinion { get; set; } = string.Empty;

    [Required]
    public ReviewResult Result { get; set; }

    [MaxLength(500)]
    public string? Suggestions { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum ReviewResult
{
    Approved,
    Rejected,
    NeedsRevision,
    EscalateToHigherLevel
}
