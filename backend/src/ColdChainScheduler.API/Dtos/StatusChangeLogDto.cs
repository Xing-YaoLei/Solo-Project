namespace ColdChainScheduler.API.Dtos;

public class StatusChangeLogDto
{
    public int Id { get; set; }
    public int EntityId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string? FromStatus { get; set; }
    public string ToStatus { get; set; } = string.Empty;
    public string? ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Remark { get; set; }
}
