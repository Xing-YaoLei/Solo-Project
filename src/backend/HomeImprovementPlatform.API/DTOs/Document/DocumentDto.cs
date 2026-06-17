using HomeImprovementPlatform.API.Enums;

namespace HomeImprovementPlatform.API.DTOs.Document;

public class DocumentDto
{
    public Guid Id { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public DocumentType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal ExpectedAmount { get; set; }
    public decimal? ActualAmount { get; set; }
    public decimal AmountDifference { get; set; }
    public AmountConsistencyStatus AmountConsistency { get; set; }
    public DocumentStatus Status { get; set; }
    public DateTime MeasurementDate { get; set; }
    public DateTime? ApprovalDate { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public string ProjectName { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
    public Guid CreatedById { get; set; }
    
    public int ItemCount { get; set; }
    public int AttachmentCount { get; set; }
    public int PendingApprovalCount { get; set; }
}

public class CreateDocumentDto
{
    public DocumentType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal ExpectedAmount { get; set; }
    public DateTime MeasurementDate { get; set; }
    public Guid ProjectId { get; set; }
    public List<CreateDocumentItemDto> Items { get; set; } = new();
}

public class UpdateDocumentDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal ExpectedAmount { get; set; }
    public decimal? ActualAmount { get; set; }
    public DateTime MeasurementDate { get; set; }
    public DocumentStatus Status { get; set; }
    public List<UpdateDocumentItemDto> Items { get; set; } = new();
}

public class CreateDocumentItemDto
{
    public int ItemOrder { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Notes { get; set; }
    public Guid? MaterialId { get; set; }
}

public class UpdateDocumentItemDto
{
    public Guid? Id { get; set; }
    public int ItemOrder { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Notes { get; set; }
    public Guid? MaterialId { get; set; }
}

public class DocumentItemDto
{
    public Guid Id { get; set; }
    public int ItemOrder { get; set; }
    public string ItemCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public string? Notes { get; set; }
    public Guid? MaterialId { get; set; }
    public string? MaterialName { get; set; }
}

public class BatchUpdateDocumentsDto
{
    public List<Guid> DocumentIds { get; set; } = new();
    public DocumentStatus? Status { get; set; }
    public Guid? AssignedToId { get; set; }
}

public class DocumentHistoryDto
{
    public Guid Id { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? MaterialsBefore { get; set; }
    public string? MaterialsAfter { get; set; }
    public string? Conclusion { get; set; }
    public string? Source { get; set; }
    public DocumentStatus? OldStatus { get; set; }
    public DocumentStatus? NewStatus { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedByName { get; set; } = string.Empty;
}
