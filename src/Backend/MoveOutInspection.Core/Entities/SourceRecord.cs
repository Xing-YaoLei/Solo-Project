
namespace MoveOutInspection.Core.Entities;

public class SourceRecord : EntityBase
{
    public string SourceType { get; set; } = string.Empty;
    public string SourceId { get; set; } = string.Empty;
    public string SourceName { get; set; } = string.Empty;
    public string? OriginalData { get; set; }
    public Guid MoveOutOrderId { get; set; }
    public MoveOutOrder? MoveOutOrder { get; set; }
    public string? Remarks { get; set; }
}
