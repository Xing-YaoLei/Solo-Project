using ColdChainScheduler.Domain.Enums;
namespace ColdChainScheduler.API.Dtos;

public class ExceptionOrderDto
{
    public int Id { get; set; }
    public string ExceptionNo { get; set; } = string.Empty;
    public int GroupBatchId { get; set; }
    public string BatchNo { get; set; } = string.Empty;
    public int? ArrivalListId { get; set; }
    public int? ProductTagId { get; set; }
    public string? ProductTagName { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerPhone { get; set; }
    public ExceptionType ExceptionType { get; set; }
    public ExceptionSeverity Severity { get; set; }
    public string? ImpactDescription { get; set; }
    public string? Responsibility { get; set; }
    public ExceptionResolution Resolution { get; set; }
    public string? ResolutionNotes { get; set; }
    public string? ResolvedBy { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<StatusChangeLogDto> StatusHistory { get; set; } = new();
}
