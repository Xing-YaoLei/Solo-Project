using PrescriptionReview.Domain.Enums;

namespace PrescriptionReview.Core.Dtos;

public class AttachmentDto
{
    public int Id { get; set; }
    public AttachmentType Type { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string ContentType { get; set; } = string.Empty;
    public int UploadedBy { get; set; }
    public string? UploaderName { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AuditLogDto
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public int OperatorId { get; set; }
    public string? OperatorName { get; set; }
    public string OldStatusName { get; set; } = string.Empty;
    public string NewStatusName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SupplementNoteDto
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public int OperatorId { get; set; }
    public string? OperatorName { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class SupplementNoteCreateDto
{
    public string Content { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
}

public class PharmacistOpinionDto
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public int PharmacistId { get; set; }
    public string? PharmacistName { get; set; }
    public string Opinion { get; set; } = string.Empty;
    public bool IsApproved { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FollowUpDto
{
    public int Id { get; set; }
    public int PrescriptionId { get; set; }
    public int OperatorId { get; set; }
    public string? OperatorName { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FollowUpCreateDto
{
    public string Content { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public string? Remark { get; set; }
}

public class FollowUpUpdateDto
{
    public string Content { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public string? Remark { get; set; }
}
