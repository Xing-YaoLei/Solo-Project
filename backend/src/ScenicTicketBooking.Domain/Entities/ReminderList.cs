using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ScenicTicketBooking.Domain.Entities;

[Table("ReminderLists")]
public class ReminderList
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    public Guid? ScenicSpotId { get; set; }

    [ForeignKey(nameof(ScenicSpotId))]
    public virtual ScenicSpot? ScenicSpot { get; set; }

    public bool IsActive { get; set; } = true;

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? UpdatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<ReminderListItem> Items { get; set; } = new List<ReminderListItem>();
    public virtual ICollection<ReminderListChangeLog> ChangeLogs { get; set; } = new List<ReminderListChangeLog>();
}
