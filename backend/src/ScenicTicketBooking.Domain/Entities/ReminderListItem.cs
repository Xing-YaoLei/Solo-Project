using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScenicTicketBooking.Domain.Entities;

[Table("ReminderListItems")]
public class ReminderListItem
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ReminderListId { get; set; }

    [ForeignKey(nameof(ReminderListId))]
    public virtual ReminderList ReminderList { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string PersonName { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(100)]
    public string? Email { get; set; }

    [MaxLength(18)]
    public string? IdCardNumber { get; set; }

    [MaxLength(100)]
    public string? Role { get; set; }

    public int SortOrder { get; set; } = 0;

    public bool ReceiveConflictNotifications { get; set; } = true;

    public bool ReceiveDailySummary { get; set; } = true;

    public bool ReceiveMonthlyReport { get; set; } = true;

    public bool IsActive { get; set; } = true;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}
