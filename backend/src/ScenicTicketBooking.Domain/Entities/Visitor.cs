using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScenicTicketBooking.Domain.Entities;

[Table("Visitors")]
public class Visitor
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(18)]
    public string IdCardNumber { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(100)]
    public string? Email { get; set; }

    public Gender Gender { get; set; } = Gender.Unknown;

    public int? Age { get; set; }

    [MaxLength(500)]
    public string? Remarks { get; set; }

    public bool IsBlacklisted { get; set; } = false;

    [MaxLength(500)]
    public string? BlacklistReason { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<TicketBooking> Bookings { get; set; } = new List<TicketBooking>();
}

public enum Gender
{
    Unknown = 0,
    Male = 1,
    Female = 2
}
