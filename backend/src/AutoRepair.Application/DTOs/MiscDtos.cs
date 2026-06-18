using AutoRepair.Domain.Entities;

namespace AutoRepair.Application.DTOs;

public class DiagnosisDto
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public string? VehicleLicensePlate { get; set; }
    public Guid? WorkOrderId { get; set; }
    public string? WorkOrderNumber { get; set; }
    public string DiagnosedByUserId { get; set; } = string.Empty;
    public string? DiagnosedByUserName { get; set; }
    public string SymptomDescription { get; set; } = string.Empty;
    public string DiagnosticResult { get; set; } = string.Empty;
    public string? FaultCodes { get; set; }
    public string? Recommendations { get; set; }
    public DateTime DiagnosedAt { get; set; }
}

public class DiagnosisCreateDto
{
    public Guid VehicleId { get; set; }
    public Guid? WorkOrderId { get; set; }
    public string SymptomDescription { get; set; } = string.Empty;
    public string DiagnosticResult { get; set; } = string.Empty;
    public string? FaultCodes { get; set; }
    public string? Recommendations { get; set; }
}

public class PartDto
{
    public Guid Id { get; set; }
    public string PartNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Specification { get; set; }
    public string? Category { get; set; }
    public decimal UnitPrice { get; set; }
    public int QuantityInStock { get; set; }
    public int ReservedQuantity { get; set; }
    public int AvailableQuantity { get; set; }
    public int ReorderLevel { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public string RiskLevelText { get; set; } = string.Empty;
}

public class PartCreateDto
{
    public string PartNumber { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Specification { get; set; }
    public string? Category { get; set; }
    public decimal UnitPrice { get; set; }
    public int InitialStock { get; set; }
    public int ReorderLevel { get; set; }
    public string? Location { get; set; }
}

public class PartUpdateDto
{
    public string? Name { get; set; }
    public string? Brand { get; set; }
    public string? Specification { get; set; }
    public string? Category { get; set; }
    public decimal? UnitPrice { get; set; }
    public int? ReorderLevel { get; set; }
    public string? Location { get; set; }
}

public class StockAlertDto
{
    public Guid Id { get; set; }
    public Guid PartInventoryId { get; set; }
    public string PartName { get; set; } = string.Empty;
    public string PartNumber { get; set; } = string.Empty;
    public RiskLevel RiskLevel { get; set; }
    public string RiskLevelText { get; set; } = string.Empty;
    public string AlertMessage { get; set; } = string.Empty;
    public bool IsAcknowledged { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public List<CommunicationLogDto> CommunicationLogs { get; set; } = new();
}

public class CommunicationLogDto
{
    public Guid Id { get; set; }
    public string FromUserId { get; set; } = string.Empty;
    public string FromUserName { get; set; } = string.Empty;
    public string? ToUserId { get; set; }
    public string? ToUserName { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public DateTime SentAt { get; set; }
}

public class CommunicationLogCreateDto
{
    public Guid? StockAlertId { get; set; }
    public Guid? QuoteId { get; set; }
    public Guid? WorkOrderId { get; set; }
    public string? ToUserId { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
}
