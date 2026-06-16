using ElderCareScheduling.API.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElderCareScheduling.API.Models.Entities;

public class ExceptionStatusHistory
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ExceptionRecordId { get; set; }

    [ForeignKey(nameof(ExceptionRecordId))]
    public virtual ExceptionRecord? ExceptionRecord { get; set; }

    [Required]
    public ExceptionStatus PreviousStatus { get; set; }

    [Required]
    public ExceptionStatus NewStatus { get; set; }

    [MaxLength(1000)]
    public string? ChangeReason { get; set; }

    [Required]
    public DateTime ChangedAt { get; set; } = DateTime.Now;

    [Required]
    [MaxLength(50)]
    public string ChangedBy { get; set; } = string.Empty;
}
