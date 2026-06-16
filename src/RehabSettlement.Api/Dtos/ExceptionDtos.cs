namespace RehabSettlement.Api.Dtos;

public class ExceptionRecordDto
{
    public int Id { get; set; }
    public int BillId { get; set; }
    public string BillNo { get; set; } = string.Empty;
    public string ExceptionType { get; set; } = string.Empty;
    public int? RejectionReasonId { get; set; }
    public string? RejectionReasonName { get; set; }
    public string? Description { get; set; }
    public int? HandlerId { get; set; }
    public string? HandlerName { get; set; }
    public string? HandleMethod { get; set; }
    public string? HandleRemark { get; set; }
    public DateTime? HandledAt { get; set; }
    public DateTime? EscalatedAt { get; set; }
    public int? EscalatedTo { get; set; }
    public string? EscalatedToName { get; set; }
    public bool IsClosed { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<SupplementMaterialDto> SupplementMaterials { get; set; } = new();
}

public class SupplementMaterialDto
{
    public int Id { get; set; }
    public int ExceptionRecordId { get; set; }
    public int BillId { get; set; }
    public string MaterialName { get; set; } = string.Empty;
    public string? MaterialType { get; set; }
    public string? FileUrl { get; set; }
    public string? Remark { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class HandleExceptionDto
{
    public int ExceptionRecordId { get; set; }
    public string HandleMethod { get; set; } = string.Empty;
    public string? HandleRemark { get; set; }
    public int? HandlerId { get; set; }
    public int? EscalatedTo { get; set; }
    public List<CreateSupplementMaterialDto>? SupplementMaterials { get; set; }
}

public class CreateSupplementMaterialDto
{
    public string MaterialName { get; set; } = string.Empty;
    public string? MaterialType { get; set; }
    public string? FileUrl { get; set; }
    public string? Remark { get; set; }
    public int? UploadedById { get; set; }
}

public class CreateExceptionRecordDto
{
    public int BillId { get; set; }
    public string ExceptionType { get; set; } = string.Empty;
    public int? RejectionReasonId { get; set; }
    public string? Description { get; set; }
    public int? HandlerId { get; set; }
}

public class CloseExceptionDto
{
    public int ExceptionRecordId { get; set; }
    public string? CloseRemark { get; set; }
    public int? ClosedById { get; set; }
}
