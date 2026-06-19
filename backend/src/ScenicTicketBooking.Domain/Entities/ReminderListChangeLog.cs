using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace ScenicTicketBooking.Domain.Entities;

[Table("ReminderListChangeLogs")]
public class ReminderListChangeLog
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ReminderListId { get; set; }

    [ForeignKey(nameof(ReminderListId))]
    public virtual ReminderList ReminderList { get; set; } = null!;

    public Guid? ReminderListItemId { get; set; }

    [ForeignKey(nameof(ReminderListItemId))]
    public virtual ReminderListItem? ReminderListItem { get; set; }

    [Required]
    [MaxLength(50)]
    public string ChangeType { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FieldName { get; set; } = string.Empty;

    [Column(TypeName = "nvarchar(max)")]
    public string? OldValue { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? NewValue { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? OldValuesSnapshot { get; set; }

    [Column(TypeName = "nvarchar(max)")]
    public string? NewValuesSnapshot { get; set; }

    [MaxLength(500)]
    public string? ChangeReason { get; set; }

    [Required]
    [MaxLength(100)]
    public string ChangedBy { get; set; } = string.Empty;

    [Required]
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    [NotMapped]
    public Dictionary<string, object?>? OldValues
    {
        get => string.IsNullOrEmpty(OldValuesSnapshot) ? null : JsonSerializer.Deserialize<Dictionary<string, object?>>(OldValuesSnapshot);
        set => OldValuesSnapshot = value != null ? JsonSerializer.Serialize(value) : null;
    }

    [NotMapped]
    public Dictionary<string, object?>? NewValues
    {
        get => string.IsNullOrEmpty(NewValuesSnapshot) ? null : JsonSerializer.Deserialize<Dictionary<string, object?>>(NewValuesSnapshot);
        set => NewValuesSnapshot = value != null ? JsonSerializer.Serialize(value) : null;
    }
}
