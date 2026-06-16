using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ElderCareScheduling.API.Models.Entities;

public class ExceptionAttachment
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ExceptionRecordId { get; set; }

    [ForeignKey(nameof(ExceptionRecordId))]
    public virtual ExceptionRecord? ExceptionRecord { get; set; }

    [Required]
    [MaxLength(500)]
    public string FileName { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FileType { get; set; }

    [MaxLength(500)]
    public string? FilePath { get; set; }

    public long? FileSize { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? AttachmentCategory { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Required]
    [MaxLength(50)]
    public string CreatedBy { get; set; } = string.Empty;
}
